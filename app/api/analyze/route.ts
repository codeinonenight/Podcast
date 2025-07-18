import { NextRequest, NextResponse } from 'next/server'
import { openRouterClient } from '@/lib/ai/openrouter-client'
import { DatabaseService, ProcessingStatus } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, analysisType = 'comprehensive' } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the session with transcription
    const session = await DatabaseService.getPodcastSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.transcription) {
      return NextResponse.json(
        { error: 'Transcription not available for analysis' },
        { status: 400 }
      )
    }

    // Check if already analyzed (but allow re-analysis)
    if (session.summary || session.topics || session.mindmap || session.insights) {
      console.log('🔧 Analyze: Session already analyzed, allowing re-analysis')
      // Clear existing analysis data for re-analysis
      await DatabaseService.updatePodcastSession(sessionId, {
        summary: null,
        topics: null,
        mindmap: null,
        insights: null
      })
    }

    // Start analysis in background
    analyzeContentAsync(sessionId, session.transcription, {
      title: session.title,
      author: session.author,
      duration: session.duration
    }, analysisType).catch(console.error)

    return NextResponse.json({
      message: 'Analysis started',
      sessionId: sessionId,
      status: 'ANALYZING'
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function analyzeContentAsync(
  sessionId: string, 
  transcription: string, 
  metadata: any,
  analysisType: string
) {
  try {
    // Update status to analyzing
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.ANALYZING,
      10,
      'Starting AI content analysis'
    )

    const results: any = {}

    // Generate comprehensive analysis
    if (analysisType === 'comprehensive' || analysisType === 'summary') {
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.ANALYZING,
        20,
        'Generating summary...'
      )

      const summaryResult = await openRouterClient.generateSummary(transcription, metadata)
      if (summaryResult.success && summaryResult.data) {
        results.summary = summaryResult.data
      }
    }

    if (analysisType === 'comprehensive' || analysisType === 'topics') {
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.ANALYZING,
        40,
        'Extracting topics and themes...'
      )

      const topicsResult = await openRouterClient.extractTopics(transcription)
      if (topicsResult.success && topicsResult.data) {
        results.topics = topicsResult.data
      }
    }

    if (analysisType === 'comprehensive' || analysisType === 'mindmap') {
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.ANALYZING,
        60,
        'Creating mindmap structure...'
      )

      const mindmapResult = await openRouterClient.generateMindmap(transcription, metadata)
      if (mindmapResult.success && mindmapResult.data) {
        results.mindmap = mindmapResult.data
      }
    }

    if (analysisType === 'comprehensive' || analysisType === 'insights') {
      await DatabaseService.updateProcessingStatus(
        sessionId,
        ProcessingStatus.ANALYZING,
        80,
        'Generating insights and advice...'
      )

      const insightsResult = await openRouterClient.generateInsights(transcription, metadata)
      if (insightsResult.success && insightsResult.data) {
        results.insights = insightsResult.data
      }
    }

    // Update session with analysis results
    await DatabaseService.updatePodcastSession(sessionId, {
      status: ProcessingStatus.COMPLETED,
      progress: 100,
      currentStep: 'Analysis completed',
      summary: results.summary?.summary,
      topics: results.topics,
      mindmap: results.mindmap,
      insights: results.insights
    })

    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.COMPLETED,
      100,
      'Analysis completed successfully'
    )
  } catch (error) {
    console.error('Content analysis error:', error)
    
    await DatabaseService.updateProcessingStatus(
      sessionId,
      ProcessingStatus.FAILED,
      0,
      'Analysis failed',
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
      analysis: {
        summary: session.summary,
        topics: session.topics,
        mindmap: session.mindmap,
        insights: session.insights
      },
      metadata: session.title ? {
        title: session.title,
        description: session.description,
        author: session.author,
        duration: session.duration,
        thumbnail: session.thumbnail
      } : null,
      transcription: session.transcription,
      transcriptionLanguage: session.transcriptionLanguage,
      transcriptionConfidence: session.transcriptionConfidence
    })
  } catch (error) {
    console.error('Get analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 