import { NextRequest, NextResponse } from 'next/server'
import { detectPlatform } from '@/lib/platform-detector'
import { processAudioPipeline } from '@/lib/processing/audio-pipeline'
import { DatabaseService, ProcessingStatus } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Detect platform
    const platform = detectPlatform(url)
    if (!platform) {
      return NextResponse.json(
        { error: 'Unsupported platform' },
        { status: 400 }
      )
    }

    // Create database session
    const session = await DatabaseService.createPodcastSession({
      originalUrl: url,
      platform: platform.name
    })

    // Start processing in background
    processAudioAsync(session.id, url, platform).catch(console.error)

    return NextResponse.json({
      sessionId: session.id,
      platform: platform.name,
      status: 'PENDING'
    })
  } catch (error) {
    console.error('Extract API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processAudioAsync(sessionId: string, url: string, platform: any) {
  try {
    // Use the integrated pipeline for processing
    const result = await processAudioPipeline(sessionId, url, platform, {
      transcribeAudio: true,
      analyzeContent: false
    })

    if (!result.success) {
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.FAILED,
        0,
        'Processing failed',
        result.error
      )
    }
  } catch (error) {
    console.error('Audio processing error:', error)
    
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.FAILED,
      0,
      'Processing failed',
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
      platform: session.platform,
      originalUrl: session.originalUrl,
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
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 