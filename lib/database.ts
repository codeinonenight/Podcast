import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Define ProcessingStatus enum locally since Prisma generates it
export enum ProcessingStatus {
  PENDING = 'PENDING',
  EXTRACTING_AUDIO = 'EXTRACTING_AUDIO',
  TRANSCRIBING = 'TRANSCRIBING',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// Database utility functions
export class DatabaseService {
  static async createPodcastSession(data: {
    originalUrl: string
    platform: string
  }) {
    return await prisma.podcastSession.create({
      data
    })
  }

  static async updatePodcastSession(id: string, data: any) {
    return await prisma.podcastSession.update({
      where: { id },
      data
    })
  }

  static async getPodcastSession(id: string) {
    return await prisma.podcastSession.findUnique({
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
    return await prisma.podcastSession.update({
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
    return await prisma.processingJob.create({
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
    return await prisma.processingJob.update({
      where: { sessionId },
      data
    })
  }

  static async getProcessingJob(sessionId: string) {
    return await prisma.processingJob.findUnique({
      where: { sessionId }
    })
  }

  static async getRecentSessions(limit: number = 10) {
    return await prisma.podcastSession.findMany({
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
    return await prisma.chatSession.create({
      data: {
        podcastSessionId,
        messages: []
      }
    })
  }

  static async updateChatSession(id: string, messages: any[]) {
    return await prisma.chatSession.update({
      where: { id },
      data: { messages }
    })
  }

  static async cleanup() {
    // Clean up old failed sessions (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    await prisma.podcastSession.deleteMany({
      where: {
        status: 'FAILED',
        createdAt: {
          lt: oneDayAgo
        }
      }
    })

    // Clean up orphaned processing jobs
    await prisma.processingJob.deleteMany({
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
} 