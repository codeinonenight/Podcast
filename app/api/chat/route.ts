import { NextRequest, NextResponse } from 'next/server'
import { openRouterClient } from '@/lib/ai/openrouter-client'
import { DatabaseService } from '@/lib/database'

interface ChatSession {
  id: string
  messages: any[]
  createdAt: Date
  updatedAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, chatSessionId } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Get the podcast session with content
    const session = await DatabaseService.getPodcastSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.transcription) {
      return NextResponse.json(
        { error: 'No content available for chat' },
        { status: 400 }
      )
    }

    // Get or create chat session
    let currentChatSession
    if (chatSessionId) {
      const chatSessions = session.chatSessions || []
      currentChatSession = chatSessions.find(cs => cs.id === chatSessionId)
    }

    if (!currentChatSession) {
      currentChatSession = await DatabaseService.createChatSession(sessionId)
    }

    // Prepare context for the AI
    const context = `
Podcast Information:
- Title: ${session.title || 'Unknown'}
- Author: ${session.author || 'Unknown'}
- Duration: ${session.duration ? Math.round(session.duration / 60) + ' minutes' : 'Unknown'}

Transcription:
${session.transcription}

${session.summary ? `\nSummary: ${session.summary}` : ''}
    `.trim()

    // Get conversation history
    const conversationHistory = (currentChatSession.messages as any[]) || []

    // Use OpenRouter for question answering
    const response = await openRouterClient.answerQuestion(
      message,
      session.transcription,
      {
        title: session.title,
        author: session.author,
        duration: session.duration
      }
    )

    if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Create new message entries
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const assistantMessage = {
      role: 'assistant',
      content: response.data?.answer || 'I apologize, but I was unable to generate a response.',
      confidence: response.data?.confidence || 0.5,
      sources: response.data?.sources || [],
      relatedTopics: response.data?.relatedTopics || [],
      timestamp: new Date().toISOString()
    }

    // Update conversation history
    const updatedMessages = [...conversationHistory, userMessage, assistantMessage]
    await DatabaseService.updateChatSession((currentChatSession as any).id, updatedMessages)

    return NextResponse.json({
      chatSessionId: currentChatSession.id,
      response: assistantMessage.content,
      confidence: assistantMessage.confidence,
      sources: assistantMessage.sources,
      relatedTopics: assistantMessage.relatedTopics,
      conversationHistory: updatedMessages
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')
  const chatSessionId = request.nextUrl.searchParams.get('chatSessionId')
  
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

    if (chatSessionId) {
      // Get specific chat session
      const chatSessions = session.chatSessions || []
      const chatSession = chatSessions.find(cs => cs.id === chatSessionId)
      
      if (!chatSession) {
        return NextResponse.json(
          { error: 'Chat session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        chatSessionId: chatSession.id,
        messages: chatSession.messages,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt
      })
    } else {
      // Get all chat sessions for this podcast session
      return NextResponse.json({
        sessionId: session.id,
        chatSessions: session.chatSessions?.map(cs => ({
          id: cs.id,
          createdAt: cs.createdAt,
          updatedAt: cs.updatedAt,
          messageCount: (cs.messages as any[])?.length || 0,
          lastMessage: (cs.messages as any[])?.slice(-1)[0] || null
        })) || []
      })
    }
  } catch (error) {
    console.error('Get chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Conversational chat endpoint (alternative to Q&A)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, chatSessionId } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      )
    }

    // Get the podcast session with content
    const session = await DatabaseService.getPodcastSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.transcription) {
      return NextResponse.json(
        { error: 'No content available for chat' },
        { status: 400 }
      )
    }

    // Get or create chat session
    let currentChatSession
    if (chatSessionId) {
      const chatSessions = session.chatSessions || []
      currentChatSession = chatSessions.find(cs => cs.id === chatSessionId)
    }

    if (!currentChatSession) {
      currentChatSession = await DatabaseService.createChatSession(sessionId)
    }

    // Prepare context for the AI
    const context = `
Podcast: "${session.title || 'Unknown'}" by ${session.author || 'Unknown'}

Content Summary:
${session.summary || 'No summary available'}

Key Topics:
${session.topics ? JSON.stringify(session.topics, null, 2) : 'No topics extracted'}

Full Transcription:
${session.transcription}
    `.trim()

    // Get conversation history
    const conversationHistory = (currentChatSession.messages as any[]) || []
    
    // Convert to OpenRouter format
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Use conversational chat
    const response = await openRouterClient.chat(message, context, formattedHistory)

    if (!response.success) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Create new message entries
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const assistantMessage = {
      role: 'assistant',
      content: response.content || 'I apologize, but I was unable to generate a response.',
      timestamp: new Date().toISOString()
    }

    // Update conversation history
    const updatedMessages = [...conversationHistory, userMessage, assistantMessage]
    await DatabaseService.updateChatSession(currentChatSession.id, updatedMessages)

    return NextResponse.json({
      chatSessionId: currentChatSession.id,
      response: assistantMessage.content,
      conversationHistory: updatedMessages,
      usage: response.usage
    })
  } catch (error) {
    console.error('Conversational chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 