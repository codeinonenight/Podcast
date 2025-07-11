import * as fs from 'fs'
import * as path from 'path'
import FormData from 'form-data'
import fetch from 'node-fetch'

export interface TranscriptionResult {
  success: boolean
  text?: string
  language?: string
  confidence?: number
  duration?: number
  error?: string
  segments?: TranscriptionSegment[]
  detectedLanguages?: string[]
}

export interface TranscriptionSegment {
  text: string
  start: number
  end: number
  confidence: number
  speaker?: string
}

export interface TranscriptionProgress {
  stage: 'initializing' | 'uploading' | 'processing' | 'complete'
  percentage: number
  currentText?: string
  detectedLanguage?: string
}

export class AzureSpeechService {
  private subscriptionKey: string
  private region: string
  private onProgress?: (progress: TranscriptionProgress) => void

  constructor() {
    const subscriptionKey = process.env.AZURE_SPEECH_KEY
    const region = process.env.AZURE_SPEECH_REGION || 'eastus'

    if (!subscriptionKey) {
      throw new Error('Azure Speech Service key not configured')
    }

    this.subscriptionKey = subscriptionKey
    this.region = region
  }

  setProgressCallback(callback: (progress: TranscriptionProgress) => void) {
    this.onProgress = callback
  }

  async transcribeAudio(audioPath: string, language?: string): Promise<TranscriptionResult> {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`)
      }

      if (this.onProgress) {
        this.onProgress({
          stage: 'initializing',
          percentage: 0
        })
      }

      // Check file size and format
      const stats = fs.statSync(audioPath)
      const fileSizeInMB = stats.size / (1024 * 1024)
      
      if (fileSizeInMB > 100) {
        throw new Error(`File too large: ${fileSizeInMB.toFixed(1)}MB. Maximum supported size is 100MB.`)
      }

      // Convert to supported format if needed
      const processedAudioPath = await this.prepareAudioFile(audioPath)

      // Use Fast transcription API
      const result = await this.fastTranscribe(processedAudioPath, language)

      // Clean up processed file if it's different from original
      if (processedAudioPath !== audioPath) {
        fs.unlinkSync(processedAudioPath)
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transcription error'
      }
    }
  }

  private async fastTranscribe(audioPath: string, language?: string): Promise<TranscriptionResult> {
    try {
      if (this.onProgress) {
        this.onProgress({
          stage: 'uploading',
          percentage: 10
        })
      }

      // Prepare the multipart form data
      const form = new FormData()
      
      // Add audio file
      const audioBuffer = fs.readFileSync(audioPath)
      form.append('audio', audioBuffer, {
        filename: path.basename(audioPath),
        contentType: this.getContentType(audioPath)
      })

      // Configure transcription definition with language identification
      const definition = {
        locales: language ? [language] : [
          "en-US", "zh-CN", "ja-JP", "ko-KR", "es-ES", 
          "fr-FR", "de-DE", "it-IT", "pt-BR", "ru-RU",
          "ar-SA", "hi-IN", "th-TH", "vi-VN", "zh-TW"
        ],
        profanityFilterMode: "None",
        punctuationMode: "DictatedAndAutomatic",
        wordLevelTimestampsEnabled: true,
        displayFormWordLevelTimestampsEnabled: true,
        diarizationEnabled: false,
        channels: [0]
      }

      form.append('definition', JSON.stringify(definition))

      if (this.onProgress) {
        this.onProgress({
          stage: 'processing',
          percentage: 30
        })
      }

      // Make the API call
      const url = `https://${this.region}.api.cognitive.microsoft.com/speechtotext/transcriptions:transcribe?api-version=2024-11-15`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          ...form.getHeaders()
        },
        body: form
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Azure Speech API error: ${response.status} - ${errorText}`)
      }

      if (this.onProgress) {
        this.onProgress({
          stage: 'processing',
          percentage: 70
        })
      }

      const result = await response.json() as any

      if (this.onProgress) {
        this.onProgress({
          stage: 'complete',
          percentage: 100
        })
      }

      return this.parseTranscriptionResult(result)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fast transcription failed'
      }
    }
  }

  private parseTranscriptionResult(apiResult: any): TranscriptionResult {
    try {
      if (!apiResult || !apiResult.combinedRecognizedPhrases) {
        return {
          success: false,
          error: 'Invalid transcription result format'
        }
      }

      const phrases = apiResult.combinedRecognizedPhrases
      if (!phrases || phrases.length === 0) {
        return {
          success: false,
          error: 'No transcription results found'
        }
      }

      // Get the best result (usually the first one)
      const bestResult = phrases[0]
      const fullText = bestResult.display || bestResult.lexical || ''

      // Extract detected languages
      const detectedLanguages: string[] = []
      if (bestResult.locale) {
        detectedLanguages.push(bestResult.locale)
      }

      // Extract segments with timestamps
      const segments: TranscriptionSegment[] = []
      if (apiResult.recognizedPhrases) {
        for (const phrase of apiResult.recognizedPhrases) {
          if (phrase.recognitionStatus === 'Success' && phrase.nBest && phrase.nBest.length > 0) {
            const best = phrase.nBest[0]
            
            if (best.words && best.words.length > 0) {
              // Create segments from words
              const words = best.words
              const startTime = words[0].offset / 10000000 // Convert from 100ns to seconds
              const endTime = words[words.length - 1].offsetInTicks / 10000000 + words[words.length - 1].durationInTicks / 10000000
              
              segments.push({
                text: best.display || best.lexical,
                start: startTime,
                end: endTime,
                confidence: best.confidence || 0
              })
            }
          }
        }
      }

      // Calculate overall confidence and duration
      const overallConfidence = segments.length > 0 
        ? segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length 
        : bestResult.confidence || 0

      const duration = segments.length > 0 
        ? Math.max(...segments.map(seg => seg.end))
        : bestResult.duration || 0

      return {
        success: true,
        text: fullText,
        language: detectedLanguages[0] || 'unknown',
        confidence: overallConfidence,
        duration: duration,
        segments: segments,
        detectedLanguages: detectedLanguages
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse transcription result: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async prepareAudioFile(inputPath: string): Promise<string> {
    const ext = path.extname(inputPath).toLowerCase()
    
    // Supported formats for Fast transcription API
    const supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.aac', '.ogg', '.webm']
    
    if (supportedFormats.includes(ext)) {
      return inputPath // File is already in supported format
    }

    // Convert to WAV if needed (simplified - in production use FFmpeg)
    const outputPath = inputPath.replace(/\.[^/.]+$/, '.wav')
    
    // For now, we'll assume the file is compatible
    // In production, you'd use FFmpeg to convert:
    // ffmpeg -i input.file -ar 16000 -ac 1 -c:a pcm_s16le output.wav
    
    return inputPath
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    }
    
    return mimeTypes[ext] || 'audio/wav'
  }

  // Get supported languages for Fast transcription
  static getSupportedLanguages(): Record<string, string> {
    return {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'en-AU': 'English (Australia)',
      'en-CA': 'English (Canada)',
      'es-ES': 'Spanish (Spain)',
      'es-MX': 'Spanish (Mexico)',
      'fr-FR': 'French (France)',
      'fr-CA': 'French (Canada)',
      'de-DE': 'German',
      'it-IT': 'Italian',
      'pt-BR': 'Portuguese (Brazil)',
      'pt-PT': 'Portuguese (Portugal)',
      'ru-RU': 'Russian',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'zh-CN': 'Chinese (Simplified)',
      'zh-TW': 'Chinese (Traditional)',
      'zh-HK': 'Chinese (Hong Kong)',
      'ar-SA': 'Arabic (Saudi Arabia)',
      'ar-EG': 'Arabic (Egypt)',
      'hi-IN': 'Hindi',
      'th-TH': 'Thai',
      'vi-VN': 'Vietnamese',
      'nl-NL': 'Dutch',
      'sv-SE': 'Swedish',
      'da-DK': 'Danish',
      'no-NO': 'Norwegian',
      'fi-FI': 'Finnish',
      'pl-PL': 'Polish',
      'cs-CZ': 'Czech',
      'hu-HU': 'Hungarian',
      'tr-TR': 'Turkish',
      'he-IL': 'Hebrew',
      'auto': 'Auto-detect (Multiple Languages)'
    }
  }

  // Get fast transcription capabilities
  static getCapabilities() {
    return {
      maxFileSizeMB: 100,
      supportedFormats: ['wav', 'mp3', 'm4a', 'flac', 'aac', 'ogg', 'webm'],
      features: [
        'Language identification',
        'Word-level timestamps',
        'Punctuation and capitalization',
        'Profanity filtering',
        'Multiple language support',
        'High accuracy',
        'Fast processing'
      ],
      limitations: [
        'File size limit: 100MB',
        'Audio length limit: ~4 hours',
        'Synchronous processing only',
        'No speaker diarization in fast mode'
      ]
    }
  }
} 