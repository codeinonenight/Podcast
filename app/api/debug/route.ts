import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const mockData = DatabaseService.getMockData()
    
    if (!mockData) {
      return NextResponse.json({ error: 'Not using mock database' }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Mock database contents',
      podcastSessions: mockData.podcastSessions.map(session => ({
        id: session.id,
        status: session.status,
        title: session.title,
        audioUrl: session.audioUrl,
        transcription: session.transcription ? 'exists' : null,
        createdAt: session.createdAt
      })),
      processingJobs: mockData.processingJobs.map(job => ({
        sessionId: job.sessionId,
        status: job.status
      })),
      chatSessions: mockData.chatSessions.length
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    )
  }
} 