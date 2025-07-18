'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Download, 
  FileText, 
  Brain, 
  MessageCircle, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Globe,
  Play,
  Pause,
  Clock,
  User,
  ExternalLink,
  Network,
  Lightbulb,
  Volume2,
  FileAudio,
  Mic,
  Sparkles,
  Folder,
  Settings,
  MoreVertical,
  Share,
  Trash2,
  Music,
  Headphones,

  Zap,
  Star,
  TrendingUp,
  Eye,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward,
  Volume1,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  Bookmark,
  Copy,
  RefreshCw
} from 'lucide-react'

// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MindmapVisualization } from '@/components/MindmapVisualization'

interface PodcastFile {
  id: string
  title: string
  author: string
  duration: number
  thumbnail?: string
  coverImage?: string
  description?: string
  publishDate?: string
  audioUrl?: string
  audioSize?: number
  audioFormat?: string
  transcription?: string
  transcriptionLanguage?: string
  transcriptionConfidence?: number
  summary?: string
  topics?: any[]
  mindmap?: any
  insights?: any
  status: 'audio-only' | 'transcribing' | 'transcribed' | 'analyzing' | 'analyzed'
  extractedAt: Date
  transcribedAt?: Date
  analyzedAt?: Date
}

interface ProcessingSession {
  id: string
  status: 'PENDING' | 'EXTRACTING_AUDIO' | 'TRANSCRIBING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  progress: number
  currentStep: string
  error?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
}

export default function PodcastTabs() {
  const [activeTab, setActiveTab] = useState<'extract' | 'manage'>('extract')
  const [urlInput, setUrlInput] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentSession, setCurrentSession] = useState<ProcessingSession | null>(null)
  const [transcriptionProgress, setTranscriptionProgress] = useState<{
    fileId: string
    progress: number
    currentStep: string
    eta?: string
  } | null>(null)
  const [podcastFiles, setPodcastFiles] = useState<PodcastFile[]>([])
  const [selectedFile, setSelectedFile] = useState<PodcastFile | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [currentView, setCurrentView] = useState<'summary' | 'mindmap' | 'chat' | null>(null)
  
  // Reset view and chat when selected file changes
  useEffect(() => {
    setCurrentView(null)
    setChatMessages([])
  }, [selectedFile?.id])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [audioElementDuration, setAudioElementDuration] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load podcast files on component mount
  useEffect(() => {
    loadPodcastFiles()
  }, [])

  const loadPodcastFiles = async () => {
    // Load files from localStorage or API
    const savedFiles = localStorage.getItem('podcastFiles')
    if (savedFiles) {
      setPodcastFiles(JSON.parse(savedFiles))
    }
  }

  const savePodcastFiles = (files: PodcastFile[]) => {
    localStorage.setItem('podcastFiles', JSON.stringify(files))
    setPodcastFiles(files)
  }

  const handleExtraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlInput.trim() || isExtracting) return

    setIsExtracting(true)
    setCurrentSession({
      id: 'temp-' + Date.now(),
      status: 'PENDING',
      progress: 0,
      currentStep: 'Starting extraction...'
    })

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      })

      if (response.ok) {
        const data = await response.json()
        pollForExtractionUpdates(data.sessionId)
      } else {
        setIsExtracting(false)
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('Extraction error:', error)
      setIsExtracting(false)
      setCurrentSession(null)
    }
  }

  const pollForExtractionUpdates = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/extract?sessionId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          
          setCurrentSession({
            id: data.id,
            status: data.status,
            progress: data.progress,
            currentStep: data.currentStep,
            error: data.error
          })

          if (data.status === 'COMPLETED') {
            setIsExtracting(false)
            // Add to podcast files
            const newFile: PodcastFile = {
              id: data.id,
              title: data.metadata?.title || 'Untitled Podcast',
              author: data.metadata?.author || 'Unknown Author',
              duration: data.metadata?.duration || 0,
              thumbnail: data.metadata?.thumbnail,
              coverImage: data.metadata?.thumbnail,
              description: data.metadata?.description,
              publishDate: data.metadata?.publishDate,
              audioUrl: data.audioUrl,
              audioSize: data.audioSize,
              audioFormat: data.audioFormat,
              status: 'audio-only',
              extractedAt: new Date()
            }
            const updatedFiles = [newFile, ...podcastFiles]
            savePodcastFiles(updatedFiles)
            setActiveTab('manage')
            setUrlInput('')
          } else if (data.status === 'FAILED') {
            setIsExtracting(false)
          } else {
            setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }

  const handleTranscription = async (fileId: string) => {
    setIsTranscribing(true)
    setTranscriptionProgress(null)
    
    try {
      // Update the file status to show it's being transcribed
      const updatedFiles = podcastFiles.map(file => 
        file.id === fileId 
          ? { ...file, status: 'transcribing' as const }
          : file
      )
      savePodcastFiles(updatedFiles)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: fileId })
      })

      if (response.ok) {
        pollForTranscriptionUpdates(fileId)
      } else {
        const errorData = await response.json()
        console.error('🔧 UI: Transcription API failed:', {
          fileId,
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        setIsTranscribing(false)
        
        // Show user-friendly error message
        alert(`Transcription failed: ${errorData.error || 'Unknown error'}`)
        
        // Reset file status on error
        const resetFiles = podcastFiles.map(file => 
          file.id === fileId 
            ? { ...file, status: 'audio-only' as const }
            : file
        )
        savePodcastFiles(resetFiles)
      }
    } catch (error) {
      console.error('🔧 UI: Transcription network error:', error)
      setIsTranscribing(false)
      
      // Show user-friendly error message
      alert(`Network error: ${error instanceof Error ? error.message : 'Failed to connect to server'}`)
      
      // Reset file status on error
      const resetFiles = podcastFiles.map(file => 
        file.id === fileId 
          ? { ...file, status: 'audio-only' as const }
            : file
      )
      savePodcastFiles(resetFiles)
    }
  }

  const cancelTranscription = async (fileId: string) => {
    try {
      const response = await fetch(`/api/transcribe?sessionId=${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('🔧 UI: Transcription cancelled successfully')
        setTranscriptionProgress(null)
        
        // Update file status back to audio-only
        const updatedFiles = podcastFiles.map(file => 
          file.id === fileId 
            ? { ...file, status: 'audio-only' as const }
            : file
        )
        savePodcastFiles(updatedFiles)
      } else {
        const errorData = await response.json()
        console.error('🔧 UI: Cancel transcription failed:', errorData)
      }
    } catch (error) {
      console.error('🔧 UI: Cancel transcription error:', error)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoadingChat || !selectedFile) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    // Add user message to chat
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsLoadingChat(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedFile.id,
          message: chatInput
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }

        setChatMessages(prev => [...prev, aiMessage])
      } else {
        const errorData = await response.json()
        console.error('🔧 UI: Chat API failed:', errorData)
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        }
        
        setChatMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('🔧 UI: Chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoadingChat(false)
    }
  }

  const pollForTranscriptionUpdates = async (fileId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/transcribe?sessionId=${fileId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Update progress tracking
          if (data.status === 'TRANSCRIBING') {
            setTranscriptionProgress({
              fileId: fileId,
              progress: data.progress || 0,
              currentStep: data.currentStep || 'Transcribing audio...',
              eta: data.eta
            })
          }
          
          if (data.status === 'COMPLETED') {
            setIsTranscribing(false)
            setTranscriptionProgress(null)
            // Update file status
            const updatedFiles = podcastFiles.map(file => 
              file.id === fileId 
                ? { 
                    ...file, 
                    status: 'transcribed' as const,
                    transcription: data.transcription,
                    transcriptionLanguage: data.transcriptionLanguage,
                    transcriptionConfidence: data.transcriptionConfidence,
                    transcribedAt: new Date()
                  }
                : file
            )
            savePodcastFiles(updatedFiles)
            if (selectedFile?.id === fileId) {
              setSelectedFile(updatedFiles.find(f => f.id === fileId) || null)
            }
          } else if (data.status === 'FAILED') {
            setIsTranscribing(false)
            setTranscriptionProgress(null)
          } else {
            setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        console.error('Transcription polling error:', error)
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }

  const handleAnalysis = async (fileId: string) => {
    setIsAnalyzing(true)
    
    try {
      // Update the file status to show it's being analyzed
      const updatedFiles = podcastFiles.map(file => 
        file.id === fileId 
          ? { ...file, status: 'analyzing' as const }
          : file
      )
      savePodcastFiles(updatedFiles)
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: fileId })
      })

      if (response.ok) {
        pollForAnalysisUpdates(fileId)
      } else {
        const errorData = await response.json()
        console.error('Analysis failed:', errorData)
        setIsAnalyzing(false)
        
        // Reset file status on error
        const resetFiles = podcastFiles.map(file => 
          file.id === fileId 
            ? { ...file, status: 'transcribed' as const }
            : file
        )
        savePodcastFiles(resetFiles)
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setIsAnalyzing(false)
      
      // Reset file status on error
      const resetFiles = podcastFiles.map(file => 
        file.id === fileId 
          ? { ...file, status: 'transcribed' as const }
            : file
      )
      savePodcastFiles(resetFiles)
    }
  }

  const pollForAnalysisUpdates = async (fileId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/analyze?sessionId=${fileId}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.status === 'COMPLETED') {
            setIsAnalyzing(false)
            // Update file status
            const updatedFiles = podcastFiles.map(file => 
              file.id === fileId 
                ? { 
                    ...file, 
                    status: 'analyzed' as const,
                    summary: data.summary,
                    topics: data.topics,
                    mindmap: data.mindmap,
                    insights: data.insights,
                    analyzedAt: new Date()
                  }
                : file
            )
            savePodcastFiles(updatedFiles)
            if (selectedFile?.id === fileId) {
              setSelectedFile(updatedFiles.find(f => f.id === fileId) || null)
            }
          } else if (data.status === 'FAILED') {
            setIsAnalyzing(false)
            // Reset status on failure
            const resetFiles = podcastFiles.map(file => 
              file.id === fileId 
                ? { ...file, status: 'transcribed' as const }
                : file
            )
            savePodcastFiles(resetFiles)
          } else {
            setTimeout(poll, 2000)
          }
        }
      } catch (error) {
        console.error('Analysis polling error:', error)
        setTimeout(poll, 2000)
      }
    }
    
    poll()
  }


  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = podcastFiles.filter(file => file.id !== fileId)
    savePodcastFiles(updatedFiles)
    
    // Close details modal if the removed file was selected
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
      setShowDetails(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getStatusColor = (status: PodcastFile['status']) => {
    switch (status) {
      case 'audio-only': return 'from-slate-500 to-slate-600'
      case 'transcribing': return 'from-blue-400 to-blue-500'
      case 'transcribed': return 'from-blue-500 to-blue-600'
      case 'analyzing': return 'from-emerald-400 to-emerald-500'
      case 'analyzed': return 'from-emerald-500 to-emerald-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusIcon = (status: PodcastFile['status']) => {
    switch (status) {
      case 'audio-only': return <FileAudio className="h-4 w-4" />
      case 'transcribing': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'transcribed': return <FileText className="h-4 w-4" />
      case 'analyzing': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'analyzed': return <Sparkles className="h-4 w-4" />
      default: return <FileAudio className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: PodcastFile['status']) => {
    switch (status) {
      case 'audio-only': return 'Audio Only'
      case 'transcribing': return 'Transcribing...'
      case 'transcribed': return 'Transcribed'
      case 'analyzing': return 'Analyzing...'
      case 'analyzed': return 'AI Analyzed'
      default: return 'Unknown'
    }
  }

  // Audio control effect
  useEffect(() => {
    if (audioRef.current && selectedFile) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, selectedFile])

  // Volume control effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Reset audio state when switching files
  useEffect(() => {
    if (selectedFile) {
      setIsPlaying(false)
      setCurrentTime(0)
      setAudioElementDuration(null)
      
      // Force load metadata immediately when file changes
      if (audioRef.current && selectedFile.audioUrl) {
        audioRef.current.load()
      }
    }
  }, [selectedFile?.id])

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'extract' | 'manage')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="extract" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              <Download className="h-4 w-4" />
              Extract
              {isExtracting && <Loader2 className="h-3 w-3 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger 
              value="manage" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              <Folder className="h-4 w-4" />
              Manage Files
              <Badge variant="secondary" className="ml-1 bg-slate-700 text-slate-300">
                {podcastFiles.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Extract Tab */}
          <TabsContent value="extract" className="space-y-6 mt-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-400" />
                  Extract Podcast Audio
                </CardTitle>
                <p className="text-slate-400">Enter any podcast URL to extract high-quality audio</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleExtraction} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://open.spotify.com/episode/... or any podcast URL"
                      className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={isExtracting}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isExtracting || !urlInput.trim()} 
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Extracting Audio...
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        Extract Audio
                      </>
                    )}
                  </Button>
                </form>

                {/* Extraction Progress */}
                {currentSession && (
                  <Card className="bg-slate-900 border-slate-600">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {currentSession.currentStep}
                          </span>
                          <span className="text-sm text-slate-400">
                            {currentSession.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${currentSession.progress}%` }}
                          />
                        </div>
                        
                        {currentSession.status === 'COMPLETED' && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 rounded-lg border border-emerald-500/20">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-5 w-5 text-emerald-400" />
                              <h3 className="font-semibold text-emerald-400">Extraction Complete!</h3>
                            </div>
                            <p className="text-sm text-slate-300">
                              Your podcast has been successfully extracted and is now available in the Manage Files tab.
                            </p>
                          </div>
                        )}
                        
                        {currentSession.status === 'FAILED' && (
                          <div className="p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-lg border border-red-500/20">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-5 w-5 text-red-400" />
                              <span className="font-semibold text-red-400">Extraction Failed</span>
                            </div>
                            <p className="text-sm text-slate-300">
                              {currentSession.error || 'An unknown error occurred'}
                            </p>
                            <Button 
                              onClick={() => setCurrentSession(null)}
                              variant="outline" 
                              size="sm" 
                              className="mt-3 border-red-500/20 text-red-400 hover:bg-red-500/10"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Platform Support */}
                <Card className="bg-slate-900 border-slate-600">
                  <CardContent className="pt-6">
                    <h3 className="text-white font-semibold mb-3">Supported Platforms</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['YouTube', 'Spotify', 'Apple Podcasts', 'SoundCloud', 'RSS Feeds', 'Xiaoyuzhou', 'Generic URLs', '900+ More'].map((platform) => (
                        <div key={platform} className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-slate-300">{platform}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Files Tab */}
          <TabsContent value="manage" className="space-y-6 mt-8">
            {podcastFiles.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <Folder className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Podcast Files Yet</h3>
                  <p className="text-slate-400 mb-6">Extract your first podcast to get started</p>
                  <Button 
                    onClick={() => setActiveTab('extract')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Extract Podcast
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {podcastFiles.map((file) => (
                  <Card 
                    key={file.id} 
                    className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all cursor-pointer group h-full flex flex-col"
                    onClick={() => {
                      setSelectedFile(file)
                      setShowDetails(true)
                    }}
                  >
                    <CardContent className="p-0 flex-1 flex flex-col">
                      {/* Cover Image */}
                      <div className="relative aspect-square overflow-hidden rounded-t-lg">
                        {file.coverImage ? (
                          <img 
                            src={file.coverImage} 
                            alt={file.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                            <Music className="h-12 w-12 text-slate-400" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className={`bg-gradient-to-r ${getStatusColor(file.status)} text-white border-0`}>
                            {getStatusIcon(file.status)}
                            <span className="ml-1">{getStatusLabel(file.status)}</span>
                          </Badge>
                        </div>

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button size="lg" className="rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm">
                            <Play className="h-6 w-6 text-white" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-white mb-1 text-sm leading-5 h-10 overflow-hidden">
                          <span className="line-clamp-2">{file.title}</span>
                        </h3>
                        <p className="text-slate-400 text-sm mb-3 truncate">
                          {file.author}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(file.duration)}
                          </span>
                          <span>{formatTimestamp(file.extractedAt)}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-auto flex gap-2">
                          {file.status === 'audio-only' && (
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTranscription(file.id)
                              }}
                              disabled={isTranscribing}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                            >
                              <Mic className="h-3 w-3 mr-1" />
                              Transcribe
                            </Button>
                          )}
                          
                          {file.status === 'transcribing' && (
                            <div className="flex-1 space-y-2">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  disabled
                                  className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500 text-white cursor-not-allowed"
                                >
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  Transcribing...
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => cancelTranscription(file.id)}
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  Cancel
                                </Button>
                              </div>
                              {transcriptionProgress && transcriptionProgress.fileId === file.id && (
                                <div className="mt-2 space-y-1">
                                  <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>{transcriptionProgress.currentStep}</span>
                                    <div className="flex items-center gap-2">
                                      <span>{transcriptionProgress.progress}%</span>
                                      {transcriptionProgress.eta && (
                                        <span className="text-slate-500">ETA: {transcriptionProgress.eta}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-1">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${transcriptionProgress.progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {file.status === 'transcribed' && (
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAnalysis(file.id)
                              }}
                              disabled={isAnalyzing}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              Analyze
                            </Button>
                          )}
                          
                          {file.status === 'analyzing' && (
                            <Button 
                              size="sm" 
                              disabled
                              className="flex-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white cursor-not-allowed"
                            >
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Analyzing...
                            </Button>
                          )}
                          
                          {file.status === 'analyzed' && (
                            <Button 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedFile(file)
                                setCurrentView('summary')
                              }}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                            >
                              <Sparkles className="h-3 w-3 mr-1" />
                              View Analysis
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-600 text-red-400 hover:bg-red-700/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveFile(file.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* File Details Modal/Panel */}
        {showDetails && selectedFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      {selectedFile.coverImage ? (
                        <img 
                          src={selectedFile.coverImage} 
                          alt={selectedFile.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                          <Music className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedFile.title}</h2>
                      <p className="text-slate-400">{selectedFile.author}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowDetails(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Audio Player */}
                <Card className="bg-slate-900 border-slate-600 mb-6">
                  <CardContent className="p-6">
                    {/* Hidden HTML5 Audio Element */}
                    <audio
                      ref={audioRef}
                      src={selectedFile.audioUrl ? `/api/audio/${selectedFile.id}` : undefined}
                      preload="metadata"
                      style={{ display: 'none' }}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime)
                        }
                      }}
                      onEnded={() => {
                        setIsPlaying(false)
                        setCurrentTime(0)
                      }}
                      onLoadedMetadata={() => {
                        if (audioRef.current?.duration && !isNaN(audioRef.current.duration)) {
                          const audioDuration = audioRef.current.duration
                          setAudioElementDuration(audioDuration)
                          
                          // Update the selected file immediately for UI display
                          if (selectedFile) {
                            setSelectedFile(prev => prev ? { ...prev, duration: audioDuration } : null)
                          }
                          
                          // Update the files array and save to storage
                          const updatedFiles = podcastFiles.map(file => 
                            file.id === selectedFile.id 
                              ? { ...file, duration: audioDuration }
                              : file
                          )
                          setPodcastFiles(updatedFiles)
                          savePodcastFiles(updatedFiles)
                        }
                      }}
                    />
                    
                    <div className="flex items-center gap-4 mb-4">
                      <Button 
                        size="lg" 
                        className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!selectedFile.audioUrl}
                      >
                        {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                      </Button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
                          <span>{formatDuration(currentTime)}</span>
                          <span>{formatDuration(audioElementDuration || selectedFile.duration)}</span>
                        </div>
                        <div 
                          className="w-full bg-slate-700 rounded-full h-2 cursor-pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const clickX = e.clientX - rect.left
                            const totalDuration = audioElementDuration || selectedFile.duration
                            if (totalDuration > 0) {
                              const newTime = (clickX / rect.width) * totalDuration
                              setCurrentTime(newTime)
                              
                              // Update the actual audio element
                              if (audioRef.current) {
                                audioRef.current.currentTime = newTime
                              }
                            }
                          }}
                        >
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-100"
                            style={{ 
                              width: `${(() => {
                                const totalDuration = audioElementDuration || selectedFile.duration
                                return totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0
                              })()}%` 
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-400">
                          <Volume1 className="h-4 w-4" />
                        </Button>
                        <div className="w-20 bg-slate-700 rounded-full h-1">
                          <div 
                            className="bg-slate-400 h-1 rounded-full"
                            style={{ width: `${volume * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status-based Content */}
                {selectedFile.status === 'audio-only' && (
                  <Card className="bg-slate-900 border-slate-600">
                    <CardContent className="p-6 text-center">
                      <Mic className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Ready for Transcription</h3>
                      <p className="text-slate-400 mb-4">
                        Convert this audio to text using AI-powered speech recognition
                      </p>
                      <Button 
                        onClick={() => handleTranscription(selectedFile.id)}
                        disabled={isTranscribing}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Transcribing...
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Start Transcription
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {selectedFile.status === 'transcribing' && (
                  <Card className="bg-slate-900 border-slate-600">
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mb-4">
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Transcription in Progress</h3>
                        <p className="text-slate-400">
                          Converting audio to text using Google Gemini 2.5 Flash
                        </p>
                      </div>
                      
                      {transcriptionProgress && transcriptionProgress.fileId === selectedFile.id && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <span>{transcriptionProgress.currentStep}</span>
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{transcriptionProgress.progress}%</span>
                              {transcriptionProgress.eta && (
                                <span className="text-slate-400">ETA: {transcriptionProgress.eta}</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-3">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${transcriptionProgress.progress}%` }}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Clock className="h-4 w-4" />
                                <span>Processing Time</span>
                              </div>
                              <div className="text-white font-medium">
                                {transcriptionProgress.progress > 0 ? 
                                  `${Math.round((Date.now() - (selectedFile.extractedAt?.getTime() || 0)) / 1000)}s` : 
                                  'Starting...'
                                }
                              </div>
                            </div>
                            <div className="bg-slate-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Sparkles className="h-4 w-4" />
                                <span>AI Service</span>
                              </div>
                              <div className="text-white font-medium">Gemini 2.5 Flash</div>
                            </div>
                          </div>
                          
                          {/* Cancel Button */}
                          <div className="flex justify-center mt-6">
                            <Button 
                              variant="outline"
                              onClick={() => cancelTranscription(selectedFile.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              Cancel Transcription
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {selectedFile.status === 'transcribed' && (
                  <div className="space-y-6">
                    {/* Transcript */}
                    <Card className="bg-slate-900 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Transcript
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64">
                          <div className="space-y-3">
                            {selectedFile.transcription?.split('\n\n').map((segment, index) => {
                              // Parse formatted transcript with timestamps and speakers
                              const timestampMatch = segment.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)$/);
                              if (timestampMatch) {
                                const [, timestamp, content] = timestampMatch;
                                const speakerMatch = content.match(/^(.+?):\s*(.+)$/);
                                
                                if (speakerMatch) {
                                  const [, speaker, text] = speakerMatch;
                                  return (
                                    <div key={index} className="border-l-2 border-slate-600 pl-4 py-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                          {timestamp}
                                        </span>
                                        <span className="text-xs text-blue-400 font-medium">
                                          {speaker}
                                        </span>
                                      </div>
                                      <p className="text-slate-300 leading-relaxed">
                                        {text}
                                      </p>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={index} className="border-l-2 border-slate-600 pl-4 py-2">
                                      <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded mb-2 inline-block">
                                        {timestamp}
                                      </span>
                                      <p className="text-slate-300 leading-relaxed">
                                        {content}
                                      </p>
                                    </div>
                                  );
                                }
                              } else {
                                // Fallback for unformatted text
                                return (
                                  <p key={index} className="text-slate-300 leading-relaxed">
                                    {segment}
                                  </p>
                                );
                              }
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* AI Analysis CTA */}
                    <Card className="bg-slate-900 border-slate-600">
                      <CardContent className="p-6 text-center">
                        <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Ready for AI Analysis</h3>
                        <p className="text-slate-400 mb-4">
                          Generate summaries, topics, insights, and enable AI chat
                        </p>
                        <Button 
                          onClick={() => handleAnalysis(selectedFile.id)}
                          disabled={isAnalyzing}
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Start AI Analysis
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedFile.status === 'analyzed' && (
                  <div className="space-y-6">
                    {/* Audio Player */}
                    {selectedFile.audioUrl && (
                      <Card className="bg-slate-900 border-slate-600">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Volume2 className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-white mb-1">Audio File</h3>
                              <p className="text-sm text-slate-400">
                                {selectedFile.audioFormat?.toUpperCase() || 'AUDIO'} • {selectedFile.duration ? `${Math.floor(selectedFile.duration / 60)}:${(selectedFile.duration % 60).toString().padStart(2, '0')}` : 'Unknown duration'} • {selectedFile.audioSize ? `${(selectedFile.audioSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Transcript */}
                    {selectedFile.transcription && (
                      <Card className="bg-slate-900 border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Transcript
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-64">
                            <div className="space-y-4 text-left">
                              {selectedFile.transcription?.split('\n\n').map((segment, index) => {
                                // Parse formatted transcript with timestamps and speakers
                                const timestampMatch = segment.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)$/);
                                if (timestampMatch) {
                                  const [, timestamp, content] = timestampMatch;
                                  const speakerMatch = content.match(/^(.+?):\s*(.+)$/);
                                  
                                  // Parse timestamp to seconds for audio navigation
                                  const timeToSeconds = (timeStr: string): number => {
                                    const parts = timeStr.split(':');
                                    if (parts.length === 2) {
                                      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                    } else if (parts.length === 3) {
                                      return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
                                    }
                                    return 0;
                                  };
                                  
                                  const timeInSeconds = timeToSeconds(timestamp);
                                  const isCurrentTime = audioRef.current && Math.abs(currentTime - timeInSeconds) < 5;
                                  
                                  if (speakerMatch) {
                                    const [, speaker, text] = speakerMatch;
                                    return (
                                      <div key={index} className={`border-l-4 pl-4 py-3 transition-all duration-200 ${
                                        isCurrentTime ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                                      }`}>
                                        <div className="flex items-center gap-3 mb-2">
                                          <button 
                                            onClick={() => {
                                              if (audioRef.current) {
                                                audioRef.current.currentTime = timeInSeconds;
                                              }
                                            }}
                                            className="text-xs text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer transition-colors"
                                          >
                                            {timestamp}
                                          </button>
                                          <span className="text-sm font-medium px-2 py-1 rounded" style={{
                                            backgroundColor: speaker === 'Host' ? '#3b82f620' : 
                                                            speaker === 'Guest' ? '#10b98120' : 
                                                            speaker.includes('Speaker') ? '#6366f120' : '#64748b20',
                                            color: speaker === 'Host' ? '#60a5fa' : 
                                                   speaker === 'Guest' ? '#34d399' : 
                                                   speaker.includes('Speaker') ? '#8b5cf6' : '#94a3b8'
                                          }}>
                                            {speaker}
                                          </span>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed text-left">
                                          {text}
                                        </p>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div key={index} className={`border-l-4 pl-4 py-3 transition-all duration-200 ${
                                        isCurrentTime ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
                                      }`}>
                                        <button 
                                          onClick={() => {
                                            if (audioRef.current) {
                                              audioRef.current.currentTime = timeInSeconds;
                                            }
                                          }}
                                          className="text-xs text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded mb-2 inline-block cursor-pointer transition-colors"
                                        >
                                          {timestamp}
                                        </button>
                                        <p className="text-slate-300 leading-relaxed text-left">
                                          {content}
                                        </p>
                                      </div>
                                    );
                                  }
                                } else {
                                  // Fallback for unformatted text
                                  return (
                                    <div key={index} className="border-l-4 border-slate-600 pl-4 py-3">
                                      <p className="text-slate-300 leading-relaxed text-left">
                                        {segment}
                                      </p>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card 
                        className="bg-slate-900 border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log('🔧 UI: Summary button clicked')
                          setCurrentView('summary')
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <Lightbulb className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                          <h3 className="font-semibold text-white">Summary</h3>
                          <p className="text-xs text-slate-400">Key insights & takeaways</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className="bg-slate-900 border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log('🔧 UI: Mindmap button clicked')
                          setCurrentView('mindmap')
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <Network className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <h3 className="font-semibold text-white">Mindmap</h3>
                          <p className="text-xs text-slate-400">Visual knowledge map</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className="bg-slate-900 border-slate-600 hover:border-slate-500 transition-colors cursor-pointer"
                        onClick={() => {
                          console.log('🔧 UI: Chat button clicked')
                          setCurrentView('chat')
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <MessageCircle className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <h3 className="font-semibold text-white">AI Chat</h3>
                          <p className="text-xs text-slate-400">Ask questions about content</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Summary Preview */}
                    <Card className="bg-slate-900 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Quick Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-300 leading-relaxed mb-4">
                          {selectedFile.summary || 'No summary available. Try running AI analysis again.'}
                        </p>
                        
                        {/* Re-run Analysis Button */}
                        {!selectedFile.summary && (
                          <div className="flex justify-center">
                            <Button
                              onClick={async () => {
                                try {
                                  console.log('🔧 UI: Re-running AI analysis for', selectedFile.id)
                                  const response = await fetch('/api/analyze', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ sessionId: selectedFile.id })
                                  })
                                  if (response.ok) {
                                    console.log('🔧 UI: AI analysis started')
                                    // Update file status to analyzing
                                    const updatedFiles = podcastFiles.map(file => 
                                      file.id === selectedFile.id 
                                        ? { ...file, status: 'analyzing' as const }
                                        : file
                                    )
                                    savePodcastFiles(updatedFiles)
                                    setSelectedFile(prev => prev ? { ...prev, status: 'analyzing' as const } : null)
                                  }
                                } catch (error) {
                                  console.error('🔧 UI: AI analysis failed:', error)
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Run AI Analysis
                            </Button>
                          </div>
                        )}
                        
                        {/* Topics */}
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            let topics = selectedFile.topics;
                            if (typeof topics === 'string') {
                              try {
                                topics = JSON.parse(topics);
                              } catch (e) {
                                topics = [];
                              }
                            }
                            if (!Array.isArray(topics)) topics = [];
                            return topics.slice(0, 6).map((topic, index) => (
                              <Badge key={index} variant="outline" className="border-slate-600 text-slate-300">
                                {typeof topic === 'string' ? topic : topic.name || topic.topic}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* View Switching Logic */}
                    {currentView === 'summary' && (
                      <Card className="bg-slate-900 border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-5 w-5" />
                              Detailed Summary
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentView(null)}
                              className="border-slate-600 text-slate-300"
                            >
                              Back
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-invert max-w-none">
                            <p className="text-slate-300 leading-relaxed">
                              {selectedFile.summary || 'No summary available'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {currentView === 'mindmap' && (
                      <Card className="bg-slate-900 border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Network className="h-5 w-5" />
                              Knowledge Mindmap
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentView(null)}
                              className="border-slate-600 text-slate-300"
                            >
                              Back
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedFile.mindmap ? (
                            <MindmapVisualization 
                              data={(() => {
                                try {
                                  return typeof selectedFile.mindmap === 'string' 
                                    ? JSON.parse(selectedFile.mindmap) 
                                    : selectedFile.mindmap
                                } catch (error) {
                                  console.error('🔧 UI: Error parsing mindmap data:', error)
                                  return {
                                    centralTopic: 'Podcast Content',
                                    branches: [
                                      {
                                        name: 'Error parsing mindmap',
                                        subtopics: ['Please try regenerating the analysis'],
                                        connections: []
                                      }
                                    ]
                                  }
                                }
                              })()}
                            />
                          ) : (
                            <div className="bg-slate-800 rounded-lg p-8 text-center">
                              <Network className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                              <p className="text-slate-300 mb-4">No mindmap available</p>
                              <p className="text-slate-500 text-sm">
                                The mindmap will be generated during AI analysis. 
                                Try running the analysis again.
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {currentView === 'chat' && (
                      <Card className="bg-slate-900 border-slate-600">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageCircle className="h-5 w-5" />
                              AI Chat
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentView(null)}
                              className="border-slate-600 text-slate-300"
                            >
                              Back
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Chat Messages */}
                            <ScrollArea className="h-96 border border-slate-600 rounded-lg p-4">
                              <div className="space-y-4">
                                {chatMessages.length === 0 ? (
                                  <div className="text-center text-slate-400 py-8">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-600" />
                                    <p className="mb-4">Start a conversation about this podcast!</p>
                                    <div className="text-left max-w-md mx-auto space-y-2">
                                      <p className="text-sm text-slate-500 mb-2">Try asking:</p>
                                      <button 
                                        onClick={() => setChatInput("What are the main takeaways from this podcast?")}
                                        className="block w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                                      >
                                        "What are the main takeaways from this podcast?"
                                      </button>
                                      <button 
                                        onClick={() => setChatInput("Can you explain the key concepts discussed?")}
                                        className="block w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                                      >
                                        "Can you explain the key concepts discussed?"
                                      </button>
                                      <button 
                                        onClick={() => setChatInput("What are the speaker's main arguments?")}
                                        className="block w-full text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                                      >
                                        "What are the speaker's main arguments?"
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  chatMessages.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                      <div
                                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                          message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-800 text-slate-300 border border-slate-600'
                                        }`}
                                      >
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                        <p className="text-xs mt-1 opacity-70">
                                          {message.timestamp.toLocaleTimeString()}
                                        </p>
                                      </div>
                                    </div>
                                  ))
                                )}
                                {isLoadingChat && (
                                  <div className="flex justify-start">
                                    <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 flex items-center gap-2">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      <span className="text-slate-300">AI is thinking...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                            
                            {/* Chat Input */}
                            <form onSubmit={handleChatSubmit} className="flex gap-2">
                              <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleChatSubmit(e)
                                  }
                                }}
                                placeholder="Ask a question about the podcast..."
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoadingChat}
                              />
                              <Button
                                type="submit"
                                disabled={isLoadingChat || !chatInput.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isLoadingChat ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Send'
                                )}
                              </Button>
                            </form>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 