'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { validateUrl, extractDomain, debounce } from '@/lib/utils'
import { detectPlatform, PlatformInfo } from '@/lib/platform-detector'
import toast from 'react-hot-toast'

interface URLInputProps {
  onProcessingStart: () => void
  onProcessingUpdate: (step: string, progress: number) => void
  onProcessingComplete: () => void
}

export default function URLInput({ 
  onProcessingStart, 
  onProcessingUpdate, 
  onProcessingComplete 
}: URLInputProps) {
  const [url, setUrl] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [platform, setPlatform] = useState<PlatformInfo | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Debounced validation
  const debouncedValidation = useCallback(
    debounce((inputUrl: string) => {
      if (!inputUrl.trim()) {
        setIsValid(null)
        setPlatform(null)
        setValidationError(null)
        return
      }

      const valid = validateUrl(inputUrl)
      setIsValid(valid)

      if (valid) {
        const detectedPlatform = detectPlatform(inputUrl)
        setPlatform(detectedPlatform)
        setValidationError(null)
      } else {
        setPlatform(null)
        setValidationError('Please enter a valid URL')
      }
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value
    setUrl(inputUrl)
    debouncedValidation(inputUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim() || !isValid || !platform) {
      toast.error('Please enter a valid URL')
      return
    }

    setIsProcessing(true)
    onProcessingStart()

    try {
      // Start the integrated processing pipeline
      onProcessingUpdate('Starting audio processing pipeline...', 5)
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })

      if (!extractResponse.ok) {
        const error = await extractResponse.json()
        throw new Error(error.error || 'Failed to start processing')
      }

      const { sessionId, platform: detectedPlatform } = await extractResponse.json()
      
      // Poll for progress updates
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/extract?sessionId=${sessionId}`)
          if (statusResponse.ok) {
            const status = await statusResponse.json()
            
            // Update progress based on status
            let progressPercent = 0
            let progressMessage = 'Processing...'
            
            switch (status.status) {
              case 'EXTRACTING_AUDIO':
                progressPercent = Math.max(10, status.progress || 10)
                progressMessage = status.currentStep || 'Extracting audio...'
                break
              case 'TRANSCRIBING':
                progressPercent = Math.max(50, status.progress || 50)
                progressMessage = status.currentStep || 'Transcribing audio...'
                break
              case 'ANALYZING':
                progressPercent = Math.max(80, status.progress || 80)
                progressMessage = status.currentStep || 'Analyzing content...'
                break
              case 'COMPLETED':
                progressPercent = 100
                progressMessage = 'Processing completed!'
                clearInterval(pollInterval)
                
                toast.success('Podcast analysis completed successfully!')
                console.log('Analysis completed:', status)
                
                // Clear the URL input
                setUrl('')
                setIsValid(null)
                setPlatform(null)
                break
              case 'FAILED':
                clearInterval(pollInterval)
                throw new Error(status.error || 'Processing failed')
            }
            
            onProcessingUpdate(progressMessage, progressPercent)
          }
        } catch (error) {
          clearInterval(pollInterval)
          throw error
        }
      }, 2000) // Poll every 2 seconds

      // Clear interval after 5 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 5 * 60 * 1000)
      
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Processing failed')
    } finally {
      setIsProcessing(false)
      onProcessingComplete()
    }
  }

  // File drop handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      toast.success(`File "${file.name}" uploaded successfully`)
      // Handle file upload - this will be implemented later
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  })

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="url"
                value={url}
                onChange={handleInputChange}
                placeholder="Enter podcast URL (YouTube, Spotify, Apple Podcasts, etc.)"
                className="w-full pl-10 pr-10 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                disabled={isProcessing}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <AnimatePresence mode="wait">
                  {isValid === null && (
                    <motion.div
                      key="neutral"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Search className="h-5 w-5 text-muted-foreground" />
                    </motion.div>
                  )}
                  {isValid === false && (
                    <motion.div
                      key="invalid"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </motion.div>
                  )}
                  {isValid === true && (
                    <motion.div
                      key="valid"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Validation Error */}
            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-destructive flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  {validationError}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Platform Detection */}
            <AnimatePresence>
              {platform && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${platform.color}`}>
                    <platform.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* File Upload Alternative */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or upload audio file
              </span>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop audio file here' : 'Drag & drop audio file'}
                </p>
                <p className="text-xs text-muted-foreground">
                  MP3, WAV, M4A, OGG, FLAC (max 100MB)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!isValid || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Analyze Podcast
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 