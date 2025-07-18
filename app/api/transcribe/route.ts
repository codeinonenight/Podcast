import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService, ProcessingStatus } from '@/lib/database'

// Track active transcriptions for cancellation
const activeTranscriptions = new Map<string, boolean>()
const activeTranscriptionServices = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, language } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the session to check if extraction is complete
    const session = await DatabaseService.getPodcastSession(sessionId)
    if (!session) {
      // Debug: check what sessions exist
      const mockData = DatabaseService.getMockData()
      console.error('🔧 Transcribe: Session not found. Available sessions:', 
        mockData?.podcastSessions.map(s => ({ id: s.id, status: s.status })) || 'none')
      
      return NextResponse.json(
        { error: `Session not found: ${sessionId}` },
        { status: 404 }
      )
    }

    // Check if extraction is complete and audio is available
    if (session.status !== ProcessingStatus.COMPLETED || !session.audioUrl) {
      console.error('🔧 Transcribe: Session status check failed', {
        sessionId,
        status: session.status,
        hasAudioUrl: !!session.audioUrl,
        expectedStatus: ProcessingStatus.COMPLETED
      })
      
      return NextResponse.json(
        { error: `Audio extraction must be completed first. Current status: ${session.status}` },
        { status: 400 }
      )
    }

    // Check if already transcribed (but allow re-transcription)
    if (session.transcription) {
      console.log('🔧 Transcribe: Session already transcribed, allowing re-transcription')
      // Clear existing transcription data for re-transcription
      await DatabaseService.updatePodcastSession(sessionId, {
        transcription: null,
        transcriptionLanguage: null,
        transcriptionConfidence: null
      })
    }

    // Mark as active transcription
    activeTranscriptions.set(sessionId, true)
    
    // Start transcription in background
    transcribeAudioAsync(sessionId, session.audioUrl, language).catch(console.error)

    return NextResponse.json({
      sessionId: sessionId,
      status: 'TRANSCRIBING',
      message: 'Transcription started'
    })
  } catch (error) {
    console.error('Transcribe API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function transcribeAudioAsync(sessionId: string, audioPath: string, language?: string) {
  try {
    // Check if cancelled before starting
    if (!activeTranscriptions.get(sessionId)) {
      console.log('🔧 Transcribe: Transcription cancelled before starting')
      return
    }
    
    // Update status to transcribing
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.TRANSCRIBING,
      0,
      'Starting transcription'
    )

    // Import Gemini Transcription Service
    const { GeminiTranscriptionService } = await import('@/lib/transcription/gemini-transcription')
    const transcriptionService = new GeminiTranscriptionService()
    
    // Store service instance for cancellation
    activeTranscriptionServices.set(sessionId, transcriptionService)
    
    // Set up progress callback
    transcriptionService.setProgressCallback(async (progress) => {
      // Check if cancelled during progress updates
      if (!activeTranscriptions.get(sessionId)) {
        console.log('🔧 Transcribe: Transcription cancelled during progress update')
        return
      }
      
      const percentage = Math.round(progress.percentage * 0.9) // 0-90% range
      let step = 'Transcribing audio'
      
      switch (progress.stage) {
        case 'initializing':
          step = 'Initializing transcription'
          break
        case 'uploading':
          step = 'Uploading audio for transcription'
          break
        case 'processing':
          step = `Processing transcription${progress.detectedLanguage ? ` (${progress.detectedLanguage})` : ''}`
          break
        case 'complete':
          step = 'Transcription completed'
          break
      }
      
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.TRANSCRIBING,
        percentage,
        step
      )
    })

    // Transcribe audio
    const result = await transcriptionService.transcribeAudio(audioPath, language)
    
    // Check if cancelled after transcription
    if (!activeTranscriptions.get(sessionId)) {
      console.log('🔧 Transcribe: Transcription cancelled after completion')
      return
    }
    
    if (result.success && result.text) {
      // Update session with transcription data
      await DatabaseService.updatePodcastSession(sessionId, {
        status: ProcessingStatus.COMPLETED,
        progress: 100,
        currentStep: 'Transcription completed',
        transcription: result.text,
        transcriptionLanguage: result.language,
        transcriptionConfidence: result.confidence
      })
    } else {
      // Update session with error
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.FAILED,
        0,
        'Transcription failed',
        result.error
      )
    }
  } catch (error) {
    console.error('Transcription error:', error)
    
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.FAILED,
      0,
      'Transcription failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
  } finally {
    // Clean up active transcription tracking
    activeTranscriptions.delete(sessionId)
    activeTranscriptionServices.delete(sessionId)
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  try {
    const session = await DatabaseService.getPodcastSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: session.id,
      status: session.status,
      progress: session.progress,
      currentStep: session.currentStep,
      error: session.error,
      transcription: session.transcription,
      transcriptionLanguage: session.transcriptionLanguage,
      transcriptionConfidence: session.transcriptionConfidence,
      metadata: session.title ? {
        title: session.title,
        description: session.description,
        author: session.author,
        duration: session.duration,
        thumbnail: session.thumbnail,
        publishDate: session.publishDate
      } : null
    })
  } catch (error) {
    console.error('Get transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel transcription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Cancel the transcription
    if (activeTranscriptions.has(sessionId)) {
      activeTranscriptions.delete(sessionId)
      
      // Cancel the transcription service if it exists
      const transcriptionService = activeTranscriptionServices.get(sessionId)
      if (transcriptionService) {
        transcriptionService.cancel()
        activeTranscriptionServices.delete(sessionId)
      }
      
      // Update database to reflect cancellation
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.COMPLETED, // Set back to completed (after extraction)
        60,
        'Transcription cancelled'
      )
      
      console.log('🔧 Transcribe: Transcription cancelled for session', sessionId)
      
      return NextResponse.json({
        sessionId: sessionId,
        status: 'CANCELLED',
        message: 'Transcription cancelled successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'No active transcription found for this session' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Cancel transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get supported languages
export async function OPTIONS() {
  const { GeminiTranscriptionService } = await import('@/lib/transcription/gemini-transcription')
  return NextResponse.json({
    supportedLanguages: GeminiTranscriptionService.getSupportedLanguages(),
    capabilities: GeminiTranscriptionService.getCapabilities()
  })
} 