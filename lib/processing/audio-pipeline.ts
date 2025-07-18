import { UniversalExtractor } from '@/lib/extractors/universal-extractor'
import { XiaoyuzhouExtractor } from '@/lib/extractors/xiaoyuzhou-extractor'
import { GeminiTranscriptionService } from '@/lib/transcription/gemini-transcription'
import { DatabaseService, ProcessingStatus } from '@/lib/database'
import { PlatformInfo } from '@/lib/platform-detector'

export interface PipelineProgress {
  stage: 'extraction' | 'transcription' | 'analysis' | 'complete'
  percentage: number
  currentStep: string
  error?: string
}

export interface PipelineResult {
  success: boolean
  sessionId: string
  audioPath?: string
  transcription?: string
  metadata?: any
  error?: string
}

export class AudioProcessingPipeline {
  private sessionId: string
  private onProgress?: (progress: PipelineProgress) => void

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  setProgressCallback(callback: (progress: PipelineProgress) => void) {
    this.onProgress = callback
  }

  async processAudio(url: string, platform: PlatformInfo, options: {
    transcribeAudio?: boolean
    targetLanguage?: string
    analyzeContent?: boolean
  } = {}): Promise<PipelineResult> {
    try {
      // Store URL in global context for mock language detection
      if (typeof global !== 'undefined') {
        (global as any).currentProcessingUrl = url
      }
      
      // Update initial status
      await DatabaseService.updateProcessingStatus(
        this.sessionId,
        ProcessingStatus.EXTRACTING_AUDIO,
        0,
        'Starting audio processing pipeline'
      )

      this.reportProgress({
        stage: 'extraction',
        percentage: 0,
        currentStep: 'Initializing audio extraction'
      })

      // Stage 1: Extract Audio
      const extractionResult = await this.extractAudio(url, platform)
      if (!extractionResult.success) {
        throw new Error(`Audio extraction failed: ${extractionResult.error}`)
      }

      // Stage 2: Transcribe Audio (if requested)
      let transcriptionResult: any = null
      if (options.transcribeAudio && extractionResult.audioPath) {
        transcriptionResult = await this.transcribeAudio(
          extractionResult.audioPath, 
          options.targetLanguage
        )
        
        if (!transcriptionResult.success) {
          console.warn('Transcription failed:', transcriptionResult.error)
          // Continue processing even if transcription fails
        }
      }

      // Stage 3: Analyze Content (if requested)
      if (options.analyzeContent && transcriptionResult?.text) {
        await this.analyzeContent(transcriptionResult.text)
      }

      // Final update
      await DatabaseService.updateProcessingStatus(
        this.sessionId,
        ProcessingStatus.COMPLETED,
        100,
        'Processing completed successfully'
      )

      this.reportProgress({
        stage: 'complete',
        percentage: 100,
        currentStep: 'Processing completed successfully'
      })

      return {
        success: true,
        sessionId: this.sessionId,
        audioPath: extractionResult.audioPath,
        transcription: transcriptionResult?.text,
        metadata: extractionResult.metadata
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      await DatabaseService.updateProcessingStatus(
        this.sessionId,
        ProcessingStatus.FAILED,
        0,
        'Processing failed',
        errorMessage
      )

      this.reportProgress({
        stage: 'complete',
        percentage: 0,
        currentStep: 'Processing failed',
        error: errorMessage
      })

      return {
        success: false,
        sessionId: this.sessionId,
        error: errorMessage
      }
    }
  }

  private async extractAudio(url: string, platform: PlatformInfo): Promise<{
    success: boolean
    audioPath?: string
    metadata?: any
    error?: string
  }> {
    try {
      let extractor: UniversalExtractor | XiaoyuzhouExtractor

      // Choose extractor based on platform and mock setting
      const USE_MOCK_EXTRACTOR = process.env.USE_MOCK_EXTRACTOR === 'true'
      
      if (USE_MOCK_EXTRACTOR) {
        console.log('🔧 Extraction: Using UniversalExtractor (mock mode) for', platform.name)
        extractor = new UniversalExtractor()
      } else if (platform.name === 'Xiaoyuzhou' || platform.extractorType === 'selenium') {
        console.log('🔧 Extraction: Using XiaoyuzhouExtractor for', platform.name, 'with extractorType:', platform.extractorType)
        extractor = new XiaoyuzhouExtractor()
      } else {
        console.log('🔧 Extraction: Using UniversalExtractor for', platform.name, 'with extractorType:', platform.extractorType)
        extractor = new UniversalExtractor()
      }

      // Set up progress callback
      extractor.setProgressCallback((progress) => {
        const percentage = Math.round(progress.percentage * 0.6) // 0-60% for extraction
        this.reportProgress({
          stage: 'extraction',
          percentage,
          currentStep: `Extracting audio: ${progress.stage} (${progress.percentage}%)`
        })
      })

      // Extract audio
      const result = await extractor.extractAudio(url, platform)
      
      if (result.success && result.audioPath && result.metadata) {
        // Update database with extraction results
        // Detect audio format from URL or default to the extracted format
        const audioFormat = result.audioPath?.includes('.m4a') ? 'm4a' : 
                           result.audioPath?.includes('.mp3') ? 'mp3' :
                           result.metadata.format || 'mp3'
        
        await DatabaseService.updatePodcastSession(this.sessionId, {
          audioUrl: result.audioPath,
          audioSize: result.fileSize,
          audioDuration: result.metadata.duration,
          audioFormat: audioFormat,
          title: result.metadata.title,
          description: result.metadata.description,
          author: result.metadata.author,
          thumbnail: result.metadata.thumbnail,
          duration: result.metadata.duration,
          publishDate: result.metadata.uploadDate ? new Date(result.metadata.uploadDate) : null
        })

        this.reportProgress({
          stage: 'extraction',
          percentage: 60,
          currentStep: 'Audio extraction completed'
        })
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      }
    }
  }

  private async transcribeAudio(audioPath: string, language?: string): Promise<{
    success: boolean
    text?: string
    language?: string
    confidence?: number
    error?: string
  }> {
    try {
      await DatabaseService.updateProcessingStatus(
        this.sessionId,
        ProcessingStatus.TRANSCRIBING,
        60,
        'Starting transcription'
      )

      this.reportProgress({
        stage: 'transcription',
        percentage: 60,
        currentStep: 'Initializing Gemini transcription service'
      })

      const transcriptionService = new GeminiTranscriptionService()
      
      // Set up progress callback
      transcriptionService.setProgressCallback((progress) => {
        const percentage = Math.round(60 + (progress.percentage * 0.3)) // 60-90% for transcription
        let step = 'Transcribing audio with Gemini'
        
        switch (progress.stage) {
          case 'initializing':
            step = 'Initializing Gemini transcription'
            break
          case 'uploading':
            step = 'Uploading audio to Gemini'
            break
          case 'processing':
            step = progress.currentText || `Processing with Gemini 2.5 Flash${progress.detectedLanguage ? ` (${progress.detectedLanguage})` : ''}`
            break
          case 'complete':
            step = 'Transcription completed'
            break
        }
        
        this.reportProgress({
          stage: 'transcription',
          percentage,
          currentStep: step
        })
      })

      // Transcribe audio
      const result = await transcriptionService.transcribeAudio(audioPath, language)
      
      if (result.success && result.text) {
        // Update database with transcription results
        await DatabaseService.updatePodcastSession(this.sessionId, {
          transcription: result.text,
          transcriptionLanguage: result.language,
          transcriptionConfidence: result.confidence
        })

        this.reportProgress({
          stage: 'transcription',
          percentage: 90,
          currentStep: 'Transcription completed'
        })
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transcription error'
      }
    }
  }

  private async analyzeContent(transcription: string): Promise<void> {
    try {
      await DatabaseService.updateProcessingStatus(
        this.sessionId,
        ProcessingStatus.ANALYZING,
        90,
        'Analyzing content'
      )

      this.reportProgress({
        stage: 'analysis',
        percentage: 90,
        currentStep: 'Analyzing content with AI'
      })

      // Get session metadata
      const session = await DatabaseService.getPodcastSession(this.sessionId)
      const metadata = session ? {
        title: session.title,
        author: session.author,
        duration: session.duration
      } : undefined

      // Import OpenRouter client dynamically to avoid initialization issues
      const { openRouterClient } = await import('@/lib/ai/openrouter-client')

      const analysisResults: any = {}

      // Generate summary
      this.reportProgress({
        stage: 'analysis',
        percentage: 91,
        currentStep: 'Generating summary...'
      })
      
      const summaryResult = await openRouterClient.generateSummary(transcription, metadata)
      if (summaryResult.success && summaryResult.data) {
        analysisResults.summary = summaryResult.data
      }

      // Extract topics
      this.reportProgress({
        stage: 'analysis',
        percentage: 93,
        currentStep: 'Extracting topics...'
      })
      
      const topicsResult = await openRouterClient.extractTopics(transcription)
      if (topicsResult.success && topicsResult.data) {
        analysisResults.topics = topicsResult.data
      }

      // Generate mindmap
      this.reportProgress({
        stage: 'analysis',
        percentage: 95,
        currentStep: 'Creating mindmap...'
      })
      
      const mindmapResult = await openRouterClient.generateMindmap(transcription, metadata)
      if (mindmapResult.success && mindmapResult.data) {
        analysisResults.mindmap = mindmapResult.data
      }

      // Generate insights
      this.reportProgress({
        stage: 'analysis',
        percentage: 97,
        currentStep: 'Generating insights...'
      })
      
      const insightsResult = await openRouterClient.generateInsights(transcription, metadata)
      if (insightsResult.success && insightsResult.data) {
        analysisResults.insights = insightsResult.data
      }

      // Update database with analysis results
      await DatabaseService.updatePodcastSession(this.sessionId, {
        summary: analysisResults.summary?.summary,
        topics: analysisResults.topics,
        mindmap: analysisResults.mindmap,
        insights: analysisResults.insights
      })

      this.reportProgress({
        stage: 'analysis',
        percentage: 99,
        currentStep: 'AI analysis completed'
      })
    } catch (error) {
      console.warn('Content analysis failed:', error)
      // Don't fail the entire pipeline for analysis errors
      // Just log the error and continue
    }
  }

  private reportProgress(progress: PipelineProgress) {
    if (this.onProgress) {
      this.onProgress(progress)
    }
  }

  // Clean up resources
  async cleanup() {
    try {
      // Clean up temporary files
      const session = await DatabaseService.getPodcastSession(this.sessionId)
      if (session?.audioUrl) {
        // Only clean up local files, not remote URLs
        if (session.audioUrl.startsWith('/') || session.audioUrl.startsWith('file://')) {
          console.log(`Cleaning up local audio file: ${session.audioUrl}`)
          // In production, you'd actually delete the file here
          // fs.unlinkSync(session.audioUrl)
        } else {
          console.log(`Audio URL is remote, no cleanup needed: ${session.audioUrl}`)
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }
}

// Factory function to create and start pipeline
export async function processAudioPipeline(
  sessionId: string,
  url: string,
  platform: PlatformInfo,
  options: {
    transcribeAudio?: boolean
    targetLanguage?: string
    analyzeContent?: boolean
  } = {}
): Promise<PipelineResult> {
  const pipeline = new AudioProcessingPipeline(sessionId)
  
  try {
    const result = await pipeline.processAudio(url, platform, options)
    return result
  } finally {
    await pipeline.cleanup()
  }
}

// Progress tracking utility
export class ProgressTracker {
  private subscribers: Map<string, (progress: PipelineProgress) => void> = new Map()

  subscribe(sessionId: string, callback: (progress: PipelineProgress) => void) {
    this.subscribers.set(sessionId, callback)
  }

  unsubscribe(sessionId: string) {
    this.subscribers.delete(sessionId)
  }

  notify(sessionId: string, progress: PipelineProgress) {
    const callback = this.subscribers.get(sessionId)
    if (callback) {
      callback(progress)
    }
  }
}

// Global progress tracker instance
export const progressTracker = new ProgressTracker() 