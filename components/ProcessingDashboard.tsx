'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare,
  FileText,
  Brain,
  Network,
  Lightbulb,
  Clock,
  User,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ProcessingState {
  sessionId: string
  status: 'PENDING' | 'EXTRACTING_AUDIO' | 'TRANSCRIBING' | 'ANALYZING' | 'COMPLETED' | 'FAILED'
  progress: number
  currentStep: string
  error?: string
  metadata?: {
    title: string
    description: string
    author: string
    duration: number
    thumbnail: string
  }
  transcription?: string
  analysis?: {
    summary: any
    topics: any
    mindmap: any
    insights: any
  }
}

interface ProcessingDashboardProps {
  sessionId: string
  onChatStart?: () => void
}

export default function ProcessingDashboard({ sessionId, onChatStart }: ProcessingDashboardProps) {
  const [state, setState] = useState<ProcessingState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/extract?sessionId=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          setState(data)
          
          // If completed, also fetch analysis
          if (data.status === 'COMPLETED') {
            try {
              const analysisResponse = await fetch(`/api/analyze?sessionId=${sessionId}`)
              if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json()
                setState(prev => prev ? {
                  ...prev,
                  analysis: analysisData.analysis
                } : null)
              }
            } catch (err) {
              console.warn('Failed to fetch analysis:', err)
            }
          }
        } else {
          setError('Failed to fetch status')
        }
      } catch (err) {
        setError('Network error')
        console.error('Polling error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    pollStatus()

    // Poll every 2 seconds if still processing
    const interval = setInterval(() => {
      if (state?.status && !['COMPLETED', 'FAILED'].includes(state.status)) {
        pollStatus()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [sessionId, state?.status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-500'
      case 'FAILED': return 'text-red-500'
      case 'EXTRACTING_AUDIO': return 'text-blue-500'
      case 'TRANSCRIBING': return 'text-purple-500'
      case 'ANALYZING': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircle
      case 'FAILED': return AlertCircle
      default: return Loader2
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading processing status...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !state) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Failed to load processing status'}</p>
        </CardContent>
      </Card>
    )
  }

  const StatusIcon = getStatusIcon(state.status)
  const isCompleted = state.status === 'COMPLETED'
  const isFailed = state.status === 'FAILED'

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <StatusIcon 
                className={`h-6 w-6 ${getStatusColor(state.status)} ${
                  !isCompleted && !isFailed ? 'animate-spin' : ''
                }`} 
              />
              Processing Status
            </CardTitle>
            {isCompleted && (
              <Button 
                onClick={onChatStart}
                className="flex items-center gap-2"
                variant="outline"
              >
                <MessageSquare className="h-4 w-4" />
                Start Chat
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{state.currentStep || 'Processing...'}</span>
              <span>{state.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error:</span>
              </div>
              <p className="mt-1 text-sm">{state.error}</p>
            </motion.div>
          )}

          {/* Metadata Display */}
          {state.metadata && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-start gap-4">
                {state.metadata.thumbnail && (
                  <img
                    src={state.metadata.thumbnail}
                    alt="Thumbnail"
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {state.metadata.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {state.metadata.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(state.metadata.duration)}
                    </span>
                  </div>
                  {state.metadata.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {state.metadata.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence>
        {isCompleted && state.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Summary */}
            {state.analysis.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {state.analysis.summary.summary || 'No summary available'}
                  </p>
                  {state.analysis.summary.keyPoints && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Key Points:</h4>
                      <ul className="space-y-1">
                        {state.analysis.summary.keyPoints.slice(0, 3).map((point: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Topics */}
            {state.analysis.topics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.analysis.topics.topics?.slice(0, 4).map((topic: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{topic.name}</h4>
                          <span className="text-xs text-gray-500">
                            {Math.round(topic.relevance * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{topic.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mindmap */}
            {state.analysis.mindmap && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Mind Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="inline-block p-3 bg-blue-100 rounded-lg">
                      <span className="font-medium text-blue-800">
                        {state.analysis.mindmap.centralTopic}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {state.analysis.mindmap.branches?.slice(0, 3).map((branch: any, index: number) => (
                      <div key={index} className="p-2 bg-gray-50 rounded">
                        <h4 className="font-medium text-sm">{branch.name}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {branch.subtopics?.slice(0, 3).map((subtopic: string, subIndex: number) => (
                            <span 
                              key={subIndex}
                              className="text-xs bg-white px-2 py-1 rounded border"
                            >
                              {subtopic}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {state.analysis.insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.analysis.insights.insights?.slice(0, 2).map((insight: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                            insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {insight.impact}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcription Preview */}
      <AnimatePresence>
        {state.transcription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Transcription Preview
                  </span>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {state.transcription.slice(0, 500)}
                    {state.transcription.length > 500 && '...'}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>Language: {state.transcription ? 'Auto-detected' : 'Unknown'}</span>
                  <span>{state.transcription.length} characters</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 