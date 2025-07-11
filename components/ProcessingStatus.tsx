'use client'

import { motion } from 'framer-motion'
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProcessingStatusProps {
  step: string
  progress: number
  isProcessing: boolean
  error?: string | null
}

export default function ProcessingStatus({ 
  step, 
  progress, 
  isProcessing, 
  error 
}: ProcessingStatusProps) {
  const steps = [
    'Extracting audio from URL...',
    'Transcribing audio...',
    'Generating AI analysis...',
    'Processing complete!'
  ]

  const getStepStatus = (stepIndex: number) => {
    const stepProgress = (stepIndex + 1) * 25
    if (error) return 'error'
    if (progress >= stepProgress) return 'completed'
    if (progress > stepIndex * 25) return 'active'
    return 'pending'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'active':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          {error ? 'Processing Failed' : isProcessing ? 'Processing...' : 'Complete'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="text-center">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-foreground"
          >
            {step}
          </motion.p>
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {steps.map((stepText, index) => {
            const status = getStepStatus(index)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  status === 'active' 
                    ? 'bg-primary/10 border border-primary/20' 
                    : status === 'completed'
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                    : status === 'error'
                    ? 'bg-destructive/10 border border-destructive/20'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {getStepIcon(status)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    status === 'active' ? 'text-primary' :
                    status === 'completed' ? 'text-green-700 dark:text-green-300' :
                    status === 'error' ? 'text-destructive' :
                    'text-muted-foreground'
                  }`}>
                    {stepText}
                  </p>
                </div>
                {status === 'active' && (
                  <div className="flex-shrink-0">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm font-medium text-destructive">Error</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </motion.div>
        )}

        {/* Success Message */}
        {!isProcessing && !error && progress === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Processing Complete!
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Your podcast has been analyzed successfully. Review the results below.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
} 