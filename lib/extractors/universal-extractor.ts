import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import { PlatformInfo } from '../platform-detector'

export interface ExtractorProgress {
  stage: 'downloading' | 'extracting' | 'converting' | 'complete'
  percentage: number
  speed?: string
  eta?: string
  size?: string
}

export interface AudioMetadata {
  title?: string
  description?: string
  author?: string
  uploader?: string
  uploadDate?: string
  duration?: number
  view_count?: number
  thumbnail?: string
  webpage_url?: string
  format?: string
  filesize?: number
  chapters?: Array<{
    title: string
    start_time: number
    end_time: number
  }>
}

export interface ExtractionResult {
  success: boolean
  audioPath?: string
  metadata?: AudioMetadata
  error?: string
  duration?: number
  fileSize?: number
}

export class UniversalExtractor {
  private tempDir: string
  private onProgress?: (progress: ExtractorProgress) => void

  constructor(tempDir: string = '/tmp/audio_processing') {
    this.tempDir = tempDir
    this.ensureTempDir()
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true })
    }
  }

  setProgressCallback(callback: (progress: ExtractorProgress) => void) {
    this.onProgress = callback
  }

  async extractAudio(url: string, platform: PlatformInfo): Promise<ExtractionResult> {
    try {
      const sessionId = this.generateSessionId()
      const outputPath = path.join(this.tempDir, `${sessionId}.%(ext)s`)
      
      // Configure yt-dlp options based on platform
      const ytdlpArgs = this.buildYtdlpArgs(url, outputPath, platform)
      
      return await this.runYtdlp(ytdlpArgs, sessionId)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      }
    }
  }

  private buildYtdlpArgs(url: string, outputPath: string, platform: PlatformInfo): string[] {
    const baseArgs = [
      url,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0', // Best quality
      '--output', outputPath,
      '--write-info-json',
      '--write-thumbnail',
      '--embed-chapters',
      '--no-playlist', // Single video only
      '--retries', '3',
      '--fragment-retries', '3',
      '--extractor-retries', '3'
    ]

    // Platform-specific optimizations
    switch (platform.extractorType) {
      case 'yt-dlp':
        if (platform.name === 'YouTube') {
          baseArgs.push('--write-auto-sub', '--write-sub', '--sub-lang', 'en')
        }
        if (platform.name === 'Spotify') {
          baseArgs.push('--cookies-from-browser', 'chrome')
        }
        break
      
      case 'selenium':
        // For platforms requiring Selenium, we'll handle separately
        baseArgs.push('--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        break
    }

    // Add progress hooks
    baseArgs.push('--newline', '--no-warnings')

    return baseArgs
  }

  private async runYtdlp(args: string[], sessionId: string): Promise<ExtractionResult> {
    return new Promise((resolve) => {
      const ytdlpPath = process.env.YTDLP_PATH || 'yt-dlp'
      const childProcess = spawn(ytdlpPath, args)
      
      let output = ''
      let errorOutput = ''
      let lastProgress: ExtractorProgress = {
        stage: 'downloading',
        percentage: 0
      }

      childProcess.stdout.on('data', (data: Buffer) => {
        const text = data.toString()
        output += text
        
        // Parse progress information
        const progress = this.parseProgress(text)
        if (progress && this.onProgress) {
          lastProgress = progress
          this.onProgress(progress)
        }
      })

      childProcess.stderr.on('data', (data: Buffer) => {
        errorOutput += data.toString()
      })

      childProcess.on('close', async (code: number) => {
        if (code === 0) {
          try {
            // Find the extracted files
            const result = await this.processExtractionResult(sessionId)
            
            if (this.onProgress) {
              this.onProgress({
                stage: 'complete',
                percentage: 100
              })
            }
            
            resolve(result)
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to process extraction result: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
          }
        } else {
          resolve({
            success: false,
            error: `yt-dlp failed with code ${code}: ${errorOutput || 'Unknown error'}`
          })
        }
      })

      childProcess.on('error', (error: Error) => {
        resolve({
          success: false,
          error: `Failed to spawn yt-dlp: ${error.message}`
        })
      })
    })
  }

  private parseProgress(output: string): ExtractorProgress | null {
    // Parse yt-dlp progress output
    const lines = output.split('\n')
    
    for (const line of lines) {
      // Download progress: [download]  45.2% of 12.34MiB at  1.23MiB/s ETA 00:08
      const downloadMatch = line.match(/\[download\]\s+(\d+\.?\d*)%.*?(\d+\.?\d*\w+iB).*?(\d+\.?\d*\w+iB\/s).*?ETA\s+(\d+:\d+)/)
      if (downloadMatch) {
        return {
          stage: 'downloading',
          percentage: parseFloat(downloadMatch[1]),
          size: downloadMatch[2],
          speed: downloadMatch[3],
          eta: downloadMatch[4]
        }
      }

      // Processing: [ffmpeg] Destination: output.mp3
      if (line.includes('[ffmpeg]') || line.includes('Converting')) {
        return {
          stage: 'converting',
          percentage: 90 // Approximate
        }
      }

      // Extraction
      if (line.includes('Extracting audio')) {
        return {
          stage: 'extracting',
          percentage: 80 // Approximate
        }
      }
    }

    return null
  }

  private async processExtractionResult(sessionId: string): Promise<ExtractionResult> {
    const files = fs.readdirSync(this.tempDir).filter(file => file.startsWith(sessionId))
    
    let audioPath: string | undefined
    let infoPath: string | undefined
    let thumbnailPath: string | undefined

    // Find extracted files
    for (const file of files) {
      const fullPath = path.join(this.tempDir, file)
      
      if (file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav')) {
        audioPath = fullPath
      } else if (file.endsWith('.info.json')) {
        infoPath = fullPath
      } else if (file.match(/\.(jpg|jpeg|png|webp)$/)) {
        thumbnailPath = fullPath
      }
    }

    if (!audioPath) {
      throw new Error('Audio file not found after extraction')
    }

    // Read metadata
    let metadata: AudioMetadata = {}
    if (infoPath && fs.existsSync(infoPath)) {
      try {
        const infoData = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
        metadata = this.extractMetadata(infoData)
      } catch (error) {
        console.warn('Failed to parse metadata:', error)
      }
    }

    // Get file statistics
    const stats = fs.statSync(audioPath)
    
    return {
      success: true,
      audioPath,
      metadata,
      fileSize: stats.size,
      duration: metadata.duration
    }
  }

  private extractMetadata(info: any): AudioMetadata {
    return {
      title: info.title,
      description: info.description,
      author: info.uploader || info.creator || info.artist,
      uploader: info.uploader,
      uploadDate: info.upload_date,
      duration: info.duration,
      view_count: info.view_count,
      thumbnail: info.thumbnail,
      webpage_url: info.webpage_url,
      format: info.format,
      filesize: info.filesize || info.filesize_approx,
      chapters: info.chapters?.map((chapter: any) => ({
        title: chapter.title,
        start_time: chapter.start_time,
        end_time: chapter.end_time
      }))
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Clean up extracted files
  async cleanup(sessionId?: string) {
    try {
      if (sessionId) {
        // Clean up specific session files
        const files = fs.readdirSync(this.tempDir).filter(file => file.startsWith(sessionId))
        for (const file of files) {
          fs.unlinkSync(path.join(this.tempDir, file))
        }
      } else {
        // Clean up old files (older than 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        const files = fs.readdirSync(this.tempDir)
        
        for (const file of files) {
          const filePath = path.join(this.tempDir, file)
          const stats = fs.statSync(filePath)
          
          if (stats.mtime.getTime() < oneHourAgo) {
            fs.unlinkSync(filePath)
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }
} 