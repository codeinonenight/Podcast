import { Builder, By, WebDriver, until } from 'selenium-webdriver'
import { Options as ChromeOptions, ServiceBuilder } from 'selenium-webdriver/chrome'
import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import fetch from 'node-fetch'
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

  async extractAudio(url: string, platform?: any): Promise<ExtractionResult> {
    try {
      console.log('🔧 Xiaoyuzhou: Starting extraction for', url)
      console.log('🔧 Xiaoyuzhou: Initializing WebDriver...')
      await this.initializeDriver()
      console.log('🔧 Xiaoyuzhou: WebDriver initialized successfully')
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'downloading',
          percentage: 10
        })
      }

      console.log('🔧 Xiaoyuzhou: Extracting from Xiaoyuzhou...')
      const result = await this.extractFromXiaoyuzhou(url)
      console.log('🔧 Xiaoyuzhou: Extraction completed successfully')
      return result
    } catch (error) {
      console.error('🔧 Xiaoyuzhou: Extraction failed:', error instanceof Error ? error.message : 'Unknown error')
      console.error('🔧 Xiaoyuzhou: Full error details:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      }
    } finally {
      await this.cleanup()
    }
  }

  private async initializeDriver() {
    try {
      console.log('🔧 Selenium: Creating Chrome options...')
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
      const chromeBinary = process.env.CHROME_BIN || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      console.log('🔧 Selenium: Setting Chrome binary path:', chromeBinary)
      chromeOptions.setChromeBinaryPath(chromeBinary)

      // Set ChromeDriver path explicitly
      const chromeDriverPath = '/opt/homebrew/bin/chromedriver'
      
      console.log('🔧 Selenium: Initializing Chrome with binary:', chromeBinary)
      console.log('🔧 Selenium: Using ChromeDriver at:', chromeDriverPath)

      // Create a service with explicit ChromeDriver path
      console.log('🔧 Selenium: Creating ServiceBuilder...')
      const serviceBuilder = new ServiceBuilder(chromeDriverPath)
        .enableVerboseLogging()

      console.log('🔧 Selenium: Building WebDriver...')
      this.driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(chromeOptions)
        .setChromeService(serviceBuilder)
        .build()
        
      console.log('🔧 Selenium: WebDriver initialized successfully')
    } catch (error) {
      console.error('🔧 Selenium: Failed to initialize WebDriver:', error instanceof Error ? error.message : 'Unknown error')
      console.error('🔧 Selenium: Full error details:', error)
      throw error
    }
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

      // Download the audio file instead of just returning the URL
      if (this.onProgress) {
        this.onProgress({
          stage: 'downloading',
          percentage: 80
        })
      }

      // Generate filename from title or use timestamp as fallback
      const baseFilename = metadata.title 
        ? `xiaoyuzhou_${metadata.title.substring(0, 50)}_${Date.now()}`
        : `xiaoyuzhou_${Date.now()}`
      const downloadedPath = await this.downloadAudio(audioUrl, baseFilename)
      
      if (this.onProgress) {
        this.onProgress({
          stage: 'complete',
          percentage: 100
        })
      }

      // Get file size of downloaded file
      const fileSize = fs.existsSync(downloadedPath) ? fs.statSync(downloadedPath).size : 0

      // Get actual audio duration from file if webpage duration wasn't found
      let actualDuration = metadata.duration || 0
      if (!actualDuration && fs.existsSync(downloadedPath)) {
        try {
          actualDuration = await this.getAudioDuration(downloadedPath)
        } catch (error) {
          console.warn('🔧 Xiaoyuzhou: Failed to get audio duration:', error)
        }
      }

      return {
        success: true,
        audioPath: downloadedPath, // Return local file path instead of URL
        metadata: {
          title: metadata.title || 'Xiaoyuzhou Audio',
          description: metadata.description || '',
          author: metadata.author || 'Unknown Author',
          thumbnail: metadata.thumbnail,
          duration: actualDuration,
          webpage_url: await this.driver!.getCurrentUrl()
        },
        fileSize: fileSize,
        duration: actualDuration
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
      // Extract title (like reference implementation)
      try {
        const titleElement = await this.driver.findElement(By.xpath("//h1[contains(@class,'title')]"))
        metadata.title = await titleElement.getText()
        console.log('🔧 Xiaoyuzhou: Found title:', metadata.title)
      } catch {
        // Try alternative selectors
        try {
          const titleElement = await this.driver.findElement(By.css('h1, .episode-title, .title'))
          metadata.title = await titleElement.getText()
          console.log('🔧 Xiaoyuzhou: Found title (alternative):', metadata.title)
        } catch {
          console.log('🔧 Xiaoyuzhou: Title not found')
        }
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

      // Extract cover image/thumbnail (specific to Xiaoyuzhou format)
      try {
        // Look for the specific Xiaoyuzhou cover image format
        const coverElement = await this.driver.findElement(By.css('img.avatar, img[class*="avatar"], img[class*="cover"]'))
        let coverUrl = await coverElement.getAttribute('src')
        
        if (coverUrl) {
          // Remove @small suffix to get larger image if present
          coverUrl = coverUrl.replace(/@small$/, '')
          metadata.thumbnail = coverUrl
          console.log('🔧 Xiaoyuzhou: Found cover image:', coverUrl)
        }
      } catch {
        // Try alternative selectors for cover image
        try {
          const imgElements = await this.driver.findElements(By.css('img'))
          for (const img of imgElements) {
            const src = await img.getAttribute('src')
            const alt = await img.getAttribute('alt')
            
            // Look for images that match episode title or are from CDN
            if (src && (src.includes('xyzcdn.net') || (alt && metadata.title && alt.includes(metadata.title.substring(0, 20))))) {
              metadata.thumbnail = src.replace(/@small$/, '')
              console.log('🔧 Xiaoyuzhou: Found cover image (fallback):', metadata.thumbnail)
              break
            }
          }
        } catch {
          console.log('🔧 Xiaoyuzhou: Cover image not found')
        }
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
      // Simple method like reference implementation: Find audio element and get src
      console.log('🔧 Xiaoyuzhou: Looking for audio elements...')
      const audioElements = await this.driver.findElements(By.css('audio'))
      
      if (audioElements.length > 0) {
        console.log(`🔧 Xiaoyuzhou: Found ${audioElements.length} audio element(s)`)
        const audioElement = audioElements[0]
        const audioUrl = await audioElement.getAttribute('src')
        
        if (audioUrl) {
          console.log('🔧 Xiaoyuzhou: Found audio URL:', audioUrl)
          // Validate the URL
          if (audioUrl.startsWith('http') || audioUrl.startsWith('https')) {
            console.log('🔧 Xiaoyuzhou: Audio URL is valid HTTP/HTTPS')
            return audioUrl
          } else {
            console.log('🔧 Xiaoyuzhou: Audio URL is not HTTP/HTTPS, skipping:', audioUrl)
          }
        } else {
          console.log('🔧 Xiaoyuzhou: Audio element found but no src attribute')
        }
      } else {
        console.log('🔧 Xiaoyuzhou: No audio elements found')
      }

      // Fallback: Look for JavaScript-loaded audio sources
      console.log('🔧 Xiaoyuzhou: Trying JavaScript method...')
      const audioUrl = await this.driver.executeScript(`
        // Look for audio elements
        const audios = document.querySelectorAll('audio');
        console.log('Found', audios.length, 'audio elements');
        for (let audio of audios) {
          console.log('Audio src:', audio.src);
          if (audio.src && (audio.src.startsWith('http') || audio.src.startsWith('https'))) {
            return audio.src;
          }
        }
        
        // Look for any elements with audio URLs in attributes
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
          for (let attr of el.attributes) {
            if (attr.value && (attr.value.includes('.mp3') || attr.value.includes('.m4a')) && 
                (attr.value.startsWith('http') || attr.value.startsWith('https'))) {
              console.log('Found audio URL in attribute:', attr.name, attr.value);
              return attr.value;
            }
          }
        }
        
        return null;
      `)
      
      if (audioUrl && typeof audioUrl === 'string') {
        console.log('🔧 Xiaoyuzhou: Found audio URL via JavaScript:', audioUrl)
        return audioUrl
      }

      console.log('🔧 Xiaoyuzhou: No audio source found')
      return null
    } catch (error) {
      console.error('🔧 Xiaoyuzhou: Audio source detection failed:', error)
      return null
    }
  }

  private async downloadAudio(audioUrl: string, filename: string): Promise<string> {
    try {
      console.log('🔧 Xiaoyuzhou: Downloading audio file from', audioUrl)
      console.log('🔧 Xiaoyuzhou: Using filename:', filename)
      
      const response = await fetch(audioUrl)
      console.log('🔧 Xiaoyuzhou: Response status:', response.status, response.statusText)
      console.log('🔧 Xiaoyuzhou: Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`)
      }

      // Determine file extension from URL or content type
      const contentType = response.headers.get('content-type') || ''
      let extension = '.m4a' // Default for Xiaoyuzhou
      
      if (contentType.includes('mp3')) {
        extension = '.mp3'
      } else if (contentType.includes('mp4') || contentType.includes('m4a')) {
        extension = '.m4a'
      } else if (audioUrl.includes('.mp3')) {
        extension = '.mp3'
      } else if (audioUrl.includes('.m4a')) {
        extension = '.m4a'
      }

      console.log('🔧 Xiaoyuzhou: Detected extension:', extension)
      console.log('🔧 Xiaoyuzhou: Content-Type:', contentType)

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      console.log('🔧 Xiaoyuzhou: Downloaded buffer size:', buffer.length, 'bytes')
      
      // More lenient filename sanitization - only replace truly problematic characters
      const sanitizedFilename = filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_')
      const outputPath = path.join(this.tempDir, `${sanitizedFilename}${extension}`)
      
      console.log('🔧 Xiaoyuzhou: Sanitized filename:', sanitizedFilename)
      console.log('🔧 Xiaoyuzhou: Output path:', outputPath)
      
      fs.writeFileSync(outputPath, buffer)
      console.log('🔧 Xiaoyuzhou: Audio file downloaded successfully to', outputPath)
      
      // Verify the file exists and has content
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath)
        console.log('🔧 Xiaoyuzhou: File verification - size:', stats.size, 'bytes')
        return outputPath
      } else {
        throw new Error('File was not created successfully')
      }
    } catch (error) {
      console.error('🔧 Xiaoyuzhou: Download error:', error)
      throw new Error(`Failed to download audio file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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

  private async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe'
      const ffprobe = spawn(ffprobePath, [
        '-v', 'quiet',
        '-show_entries', 'format=duration',
        '-of', 'csv=p=0',
        audioPath
      ])

      let output = ''
      ffprobe.stdout.on('data', (data) => {
        output += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim())
          resolve(duration || 0)
        } else {
          reject(new Error(`FFprobe failed with code ${code}`))
        }
      })

      ffprobe.on('error', (error) => {
        reject(error)
      })
    })
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