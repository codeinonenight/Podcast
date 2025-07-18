import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

import fs from 'fs'
import path from 'path'

// Mock data storage for testing without database
const mockDataFile = path.join(process.cwd(), '.tmp-mock-db.json')

// Load mock data from file or create empty structure
function loadMockData() {
  try {
    if (fs.existsSync(mockDataFile)) {
      const data = JSON.parse(fs.readFileSync(mockDataFile, 'utf8'))
      return {
        podcastSessions: new Map(data.podcastSessions || []),
        processingJobs: new Map(data.processingJobs || []),
        chatSessions: new Map(data.chatSessions || [])
      }
    }
  } catch (error) {
    console.warn('🔧 Mock DB: Failed to load persisted data, starting fresh')
  }
  
  return {
    podcastSessions: new Map(),
    processingJobs: new Map(),
    chatSessions: new Map()
  }
}

// Save mock data to file
function saveMockData() {
  try {
    const data = {
      podcastSessions: Array.from(mockData.podcastSessions.entries()),
      processingJobs: Array.from(mockData.processingJobs.entries()),
      chatSessions: Array.from(mockData.chatSessions.entries())
    }
    fs.writeFileSync(mockDataFile, JSON.stringify(data, null, 2))
  } catch (error) {
    console.warn('🔧 Mock DB: Failed to persist data:', error)
  }
}

const mockData = loadMockData()

// Check if we should use mock mode (when DATABASE_URL is not set)
const USE_MOCK_DB = !process.env.DATABASE_URL || process.env.USE_MOCK_DB === 'true'

export const prisma = USE_MOCK_DB ? null : (globalForPrisma.prisma ?? new PrismaClient())

if (process.env.NODE_ENV !== 'production' && !USE_MOCK_DB && prisma) {
  globalForPrisma.prisma = prisma
}

// Define ProcessingStatus enum locally since Prisma generates it
export enum ProcessingStatus {
  PENDING = 'PENDING',
  EXTRACTING_AUDIO = 'EXTRACTING_AUDIO',
  TRANSCRIBING = 'TRANSCRIBING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Generate a simple ID for mock data
function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

// Database utility functions with mock support
export class DatabaseService {
  static async createPodcastSession(data: {
    originalUrl: string
    platform: string
  }) {
    if (USE_MOCK_DB) {
      const session = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        originalUrl: data.originalUrl,
        platform: data.platform,
        status: ProcessingStatus.PENDING,
        currentStep: null,
        progress: 0,
        error: null,
        audioUrl: null,
        audioSize: null,
        audioDuration: null,
        audioFormat: null,
        title: null,
        description: null,
        author: null,
        publishDate: null,
        thumbnail: null,
        duration: null,
        chapters: null,
        transcription: null,
        transcriptionLanguage: null,
        transcriptionConfidence: null,
        summary: null,
        topics: null,
        mindmap: null,
        insights: null,
        chatSessions: []
      }
      mockData.podcastSessions.set(session.id, session)
      saveMockData()
      console.log('🔧 Mock DB: Created podcast session', session.id)
      return session
    }
    
    return await prisma!.podcastSession.create({
      data
    })
  }

  static async updatePodcastSession(id: string, data: any) {
    if (USE_MOCK_DB) {
      const session = mockData.podcastSessions.get(id)
      if (session) {
        Object.assign(session, data, { updatedAt: new Date() })
        saveMockData()
        console.log('🔧 Mock DB: Updated podcast session', id, Object.keys(data))
        return session
      }
      throw new Error(`Session ${id} not found`)
    }
    
    return await prisma!.podcastSession.update({
      where: { id },
      data
    })
  }

  static async getPodcastSession(id: string) {
    if (USE_MOCK_DB) {
      const session = mockData.podcastSessions.get(id)
      if (session) {
        console.log('🔧 Mock DB: Retrieved podcast session', id)
        return session
      }
      return null
    }
    
    return await prisma!.podcastSession.findUnique({
      where: { id },
      include: {
        chatSessions: true
      }
    })
  }

  static async updateProcessingStatus(
    sessionId: string, 
    status: ProcessingStatus, 
    progress: number, 
    currentStep?: string,
    error?: string
  ) {
    if (USE_MOCK_DB) {
      const session = mockData.podcastSessions.get(sessionId)
      if (session) {
        session.status = status
        session.progress = progress
        session.currentStep = currentStep || null
        session.error = error || null
        session.updatedAt = new Date()
        saveMockData()
        console.log('🔧 Mock DB: Updated processing status', sessionId, status, progress)
        return session
      }
      throw new Error(`Session ${sessionId} not found`)
    }
    
    return await prisma!.podcastSession.update({
      where: { id: sessionId },
      data: {
        status,
        progress,
        currentStep,
        error
      }
    })
  }

  static async createProcessingJob(sessionId: string) {
    if (USE_MOCK_DB) {
      const job = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId,
        status: ProcessingStatus.PENDING,
        currentStep: null,
        progress: 0,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null
      }
      mockData.processingJobs.set(sessionId, job)
      saveMockData()
      console.log('🔧 Mock DB: Created processing job', sessionId)
      return job
    }
    
    return await prisma!.processingJob.create({
      data: {
        sessionId,
        startedAt: new Date()
      }
    })
  }

  static async updateProcessingJob(
    sessionId: string,
    data: {
      status?: ProcessingStatus
      progress?: number
      currentStep?: string
      error?: string
      completedAt?: Date
      duration?: number
    }
  ) {
    if (USE_MOCK_DB) {
      const job = mockData.processingJobs.get(sessionId)
      if (job) {
        Object.assign(job, data, { updatedAt: new Date() })
        saveMockData()
        console.log('🔧 Mock DB: Updated processing job', sessionId, Object.keys(data))
        return job
      }
      throw new Error(`Processing job ${sessionId} not found`)
    }
    
    return await prisma!.processingJob.update({
      where: { sessionId },
      data
    })
  }

  static async getProcessingJob(sessionId: string) {
    if (USE_MOCK_DB) {
      const job = mockData.processingJobs.get(sessionId)
      console.log('🔧 Mock DB: Retrieved processing job', sessionId, job ? 'found' : 'not found')
      return job || null
    }
    
    return await prisma!.processingJob.findUnique({
      where: { sessionId }
    })
  }

  static async getRecentSessions(limit: number = 10) {
    if (USE_MOCK_DB) {
      const sessions = Array.from(mockData.podcastSessions.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map(session => ({
          id: session.id,
          createdAt: session.createdAt,
          originalUrl: session.originalUrl,
          platform: session.platform,
          status: session.status,
          title: session.title,
          author: session.author,
          duration: session.duration
        }))
      console.log('🔧 Mock DB: Retrieved recent sessions', sessions.length)
      return sessions
    }
    
    return await prisma!.podcastSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        originalUrl: true,
        platform: true,
        status: true,
        title: true,
        author: true,
        duration: true
      }
    })
  }

  static async createChatSession(podcastSessionId: string) {
    if (USE_MOCK_DB) {
      const chatSession = {
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        podcastSessionId,
        messages: []
      }
      mockData.chatSessions.set(chatSession.id, chatSession)
      saveMockData()
      console.log('🔧 Mock DB: Created chat session', chatSession.id)
      return chatSession
    }
    
    return await prisma!.chatSession.create({
      data: {
        podcastSessionId,
        messages: JSON.stringify([])
      }
    })
  }

  static async updateChatSession(id: string, messages: any[]) {
    if (USE_MOCK_DB) {
      const chatSession = mockData.chatSessions.get(id)
      if (chatSession) {
        chatSession.messages = messages
        chatSession.updatedAt = new Date()
        saveMockData()
        console.log('🔧 Mock DB: Updated chat session', id, messages.length, 'messages')
        return chatSession
      }
      throw new Error(`Chat session ${id} not found`)
    }
    
    return await prisma!.chatSession.update({
      where: { id },
      data: { messages: JSON.stringify(messages) }
    })
  }

  static async cleanup() {
    if (USE_MOCK_DB) {
      // Clean up old failed sessions (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      // Convert Map entries to array to avoid iterator issues
      const sessionEntries = Array.from(mockData.podcastSessions.entries())
      for (const [id, session] of sessionEntries) {
        if (session.status === 'FAILED' && session.createdAt < oneDayAgo) {
          mockData.podcastSessions.delete(id)
        }
      }

      const jobEntries = Array.from(mockData.processingJobs.entries())
      for (const [sessionId, job] of jobEntries) {
        if (job.createdAt < oneDayAgo && (job.status === 'PENDING' || job.status === 'FAILED')) {
          mockData.processingJobs.delete(sessionId)
        }
      }
      
      saveMockData()
      console.log('🔧 Mock DB: Cleanup completed')
      return
    }
    
    // Clean up old failed sessions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    await prisma!.podcastSession.deleteMany({
      where: {
        status: 'FAILED',
        createdAt: {
          lt: oneDayAgo
        }
      }
    })

    // Clean up orphaned processing jobs
    await prisma!.processingJob.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo
        },
        status: {
          in: ['PENDING', 'FAILED']
        }
      }
    })
  }

  // Mock-specific utility functions
  static getMockData() {
    if (USE_MOCK_DB) {
      return {
        podcastSessions: Array.from(mockData.podcastSessions.values()),
        processingJobs: Array.from(mockData.processingJobs.values()),
        chatSessions: Array.from(mockData.chatSessions.values())
      }
    }
    return null
  }

  static clearMockData() {
    if (USE_MOCK_DB) {
      mockData.podcastSessions.clear()
      mockData.processingJobs.clear()
      mockData.chatSessions.clear()
      saveMockData()
      console.log('🔧 Mock DB: All data cleared')
    }
  }
}

// Log the database mode on startup
if (USE_MOCK_DB) {
  console.log('🔧 Database: Using MOCK mode (no database connection required)')
} else {
  console.log('🔧 Database: Using Prisma with database connection')
} 