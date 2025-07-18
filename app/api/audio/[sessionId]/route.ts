import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'
import * as fs from 'fs'
import * as path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the session to find the audio file path
    const session = await DatabaseService.getPodcastSession(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.audioUrl) {
      return NextResponse.json(
        { error: 'No audio file available for this session' },
        { status: 404 }
      )
    }

    // Check if the file exists
    if (!fs.existsSync(session.audioUrl)) {
      console.error('🔧 Audio Serve: File not found:', session.audioUrl)
      return NextResponse.json(
        { error: 'Audio file not found on disk' },
        { status: 404 }
      )
    }

    // Get file stats
    const stats = fs.statSync(session.audioUrl)
    const fileSize = stats.size
    
    // Determine content type based on file extension
    const ext = path.extname(session.audioUrl).toLowerCase()
    let contentType = 'audio/mpeg' // default
    
    switch (ext) {
      case '.mp3':
        contentType = 'audio/mpeg'
        break
      case '.m4a':
        contentType = 'audio/mp4'
        break
      case '.wav':
        contentType = 'audio/wav'
        break
      case '.ogg':
        contentType = 'audio/ogg'
        break
      case '.webm':
        contentType = 'audio/webm'
        break
    }

    // Handle range requests for audio streaming
    const range = request.headers.get('range')
    
    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      const chunksize = (end - start) + 1
      
      // Create stream for the requested range
      const stream = fs.createReadStream(session.audioUrl, { start, end })
      
      return new NextResponse(stream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    } else {
      // Serve entire file
      const stream = fs.createReadStream(session.audioUrl)
      
      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }
  } catch (error) {
    console.error('Audio serve error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 