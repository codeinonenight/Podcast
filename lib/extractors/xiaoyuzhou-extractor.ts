import { Builder, By, WebDriver, until } from 'selenium-webdriver'
import { Options as ChromeOptions } from 'selenium-webdriver/chrome'
import * as fs from 'fs'
import * as path from 'path'
import { AudioMetadata, ExtractionResult, ExtractorProgress } from './universal-extractor'

export class XiaoyuzhouExtractor {
  private driver?: WebDriver
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

  async extractAudio(url: string): Promise<ExtractionResult> {
    try {
      await this.initializeDriver()
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'downloading',
          percentage: 10
        })
      }

      const result = await this.extractFromXiaoyuzhou(url)
      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      }
    } finally {
      await this.cleanup()
    }
  }

  private async initializeDriver() {
    const chromeOptions = new ChromeOptions()
    
    // Configure Chrome for headless operation
    chromeOptions.addArguments(
      '--headless',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-extensions',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080'
    )

    // Set Chrome binary path if specified
    const chromeBinary = process.env.CHROME_BIN || process.env.CHROME_PATH
    if (chromeBinary) {
      chromeOptions.setChromeBinaryPath(chromeBinary)
    }

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(chromeOptions)
      .build()
  }

  private async extractFromXiaoyuzhou(url: string): Promise<ExtractionResult> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized')
    }

    try {
      // Navigate to the page
      await this.driver.get(url)
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'downloading',
          percentage: 30
        })
      }

      // Wait for the page to load
      await this.driver.wait(until.titleContains('小宇宙'), 10000)

      // Extract metadata
      const metadata = await this.extractMetadata()
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'extracting',
          percentage: 60
        })
      }

      // Find audio source
      const audioUrl = await this.findAudioSource()
      
      if (!audioUrl) {
        throw new Error('Audio source not found')
      }

      if (this.onProgress) {
        this.onProgress({
          stage: 'downloading',
          percentage: 80
        })
      }

      // Download the audio file
      const audioPath = await this.downloadAudio(audioUrl, metadata.title || 'xiaoyuzhou_audio')
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'complete',
          percentage: 100
        })
      }

      return {
        success: true,
        audioPath,
        metadata,
        fileSize: fs.statSync(audioPath).size
      }
    } catch (error) {
      throw new Error(`Xiaoyuzhou extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async extractMetadata(): Promise<AudioMetadata> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized')
    }

    const metadata: AudioMetadata = {}

    try {
      // Extract title
      try {
        const titleElement = await this.driver.findElement(By.css('h1, .episode-title, .title'))
        metadata.title = await titleElement.getText()
      } catch {
        // Title not found, continue
      }

      // Extract description
      try {
        const descElement = await this.driver.findElement(By.css('.episode-description, .description, .intro'))
        metadata.description = await descElement.getText()
      } catch {
        // Description not found, continue
      }

      // Extract author/podcast name
      try {
        const authorElement = await this.driver.findElement(By.css('.podcast-title, .author, .podcast-name'))
        metadata.author = await authorElement.getText()
      } catch {
        // Author not found, continue
      }

      // Extract duration
      try {
        const durationElement = await this.driver.findElement(By.css('.duration, .time'))
        const durationText = await durationElement.getText()
        metadata.duration = this.parseDuration(durationText)
      } catch {
        // Duration not found, continue
      }

      // Extract thumbnail
      try {
        const thumbnailElement = await this.driver.findElement(By.css('img.cover, img.podcast-cover, img.episode-cover'))
        metadata.thumbnail = await thumbnailElement.getAttribute('src')
      } catch {
        // Thumbnail not found, continue
      }

      metadata.webpage_url = await this.driver.getCurrentUrl()
    } catch (error) {
      console.warn('Metadata extraction partially failed:', error)
    }

    return metadata
  }

  private async findAudioSource(): Promise<string | null> {
    if (!this.driver) {
      throw new Error('WebDriver not initialized')
    }

    try {
      // Method 1: Look for audio elements
      try {
        const audioElements = await this.driver.findElements(By.css('audio'))
        for (const audio of audioElements) {
          const src = await audio.getAttribute('src')
          if (src && src.includes('http')) {
            return src
          }
        }
      } catch {
        // Audio elements not found
      }

      // Method 2: Look for data attributes containing audio URLs
      try {
        const playElements = await this.driver.findElements(By.css('[data-src], [data-audio], [data-url]'))
        for (const element of playElements) {
          const dataSrc = await element.getAttribute('data-src') || 
                         await element.getAttribute('data-audio') || 
                         await element.getAttribute('data-url')
          if (dataSrc && (dataSrc.includes('.mp3') || dataSrc.includes('.m4a') || dataSrc.includes('audio'))) {
            return dataSrc
          }
        }
      } catch {
        // Data attributes not found
      }

      // Method 3: Look in page source for audio URLs
      try {
        const pageSource = await this.driver.getPageSource()
        const audioUrlMatch = pageSource.match(/"(https?:\/\/[^"]*\.(?:mp3|m4a|wav)[^"]*)"/)
        if (audioUrlMatch) {
          return audioUrlMatch[1]
        }
      } catch {
        // Page source search failed
      }

      // Method 4: Execute JavaScript to find audio sources
      try {
        const audioUrl = await this.driver.executeScript(`
          // Look for audio elements
          const audios = document.querySelectorAll('audio');
          for (let audio of audios) {
            if (audio.src) return audio.src;
          }
          
          // Look for data attributes
          const elements = document.querySelectorAll('[data-src], [data-audio], [data-url]');
          for (let el of elements) {
            const src = el.dataset.src || el.dataset.audio || el.dataset.url;
            if (src && (src.includes('.mp3') || src.includes('.m4a'))) {
              return src;
            }
          }
          
          // Look in window object for audio URLs
          const pageText = document.documentElement.outerHTML;
          const match = pageText.match(/https?:\\/\\/[^"'\\s]*\\.(?:mp3|m4a)/);
          return match ? match[0] : null;
        `)
        
        if (audioUrl && typeof audioUrl === 'string') {
          return audioUrl
        }
      } catch {
        // JavaScript execution failed
      }

      return null
    } catch (error) {
      console.warn('Audio source detection failed:', error)
      return null
    }
  }

  private async downloadAudio(audioUrl: string, filename: string): Promise<string> {
    const response = await fetch(audioUrl)
    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9\-_]/g, '_')
    const outputPath = path.join(this.tempDir, `${sanitizedFilename}_${Date.now()}.mp3`)
    
    fs.writeFileSync(outputPath, buffer)
    return outputPath
  }

  private parseDuration(durationText: string): number | undefined {
    try {
      // Parse duration in format "MM:SS" or "HH:MM:SS"
      const parts = durationText.trim().split(':').map(Number)
      
      if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1]
      } else if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
      }
    } catch {
      // Parsing failed
    }
    
    return undefined
  }

  async cleanup() {
    if (this.driver) {
      try {
        await this.driver.quit()
      } catch (error) {
        console.warn('Driver cleanup failed:', error)
      }
      this.driver = undefined
    }
  }

  // Clean up downloaded files
  async cleanupFiles(sessionId?: string) {
    try {
      if (sessionId) {
        // Clean up specific session files
        const files = fs.readdirSync(this.tempDir).filter(file => file.includes(sessionId))
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
      console.warn('File cleanup failed:', error)
    }
  }
} 