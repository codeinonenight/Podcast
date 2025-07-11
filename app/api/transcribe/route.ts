import { NextRequest, NextResponse } from 'next/server'
import { AzureSpeechService } from '@/lib/transcription/azure-speech'
import { DatabaseService, ProcessingStatus } from '@/lib/database'

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

    // Get the session
    const session = await DatabaseService.getPodcastSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.audioUrl) {
      return NextResponse.json(
        { error: 'Audio not available for transcription' },
        { status: 400 }
      )
    }

    // Start transcription in background
    transcribeAudioAsync(sessionId, session.audioUrl, language).catch(console.error)

    return NextResponse.json({
      message: 'Transcription started',
      sessionId: sessionId,
      status: 'TRANSCRIBING'
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
    // Update status to transcribing
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.TRANSCRIBING,
      5,
      'Initializing transcription service'
    )

    // Initialize Azure Speech Service
    const speechService = new AzureSpeechService()
    
    // Set up progress callback
    speechService.setProgressCallback(async (progress) => {
      const percentage = Math.round(5 + (progress.percentage * 0.85)) // 5-90% range
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
    const result = await speechService.transcribeAudio(audioPath, language)
    
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
    console.error('Transcription processing error:', error)
    
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.FAILED,
      0,
      'Transcription failed',
      error instanceof Error ? error.message : 'Unknown error'
    )
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
        thumbnail: session.thumbnail
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

// Get supported languages
export async function OPTIONS() {
  return NextResponse.json({
    supportedLanguages: AzureSpeechService.getSupportedLanguages()
  })
} 