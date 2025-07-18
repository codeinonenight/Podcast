'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mic, Play, Brain, MessageCircle, Globe, Sparkles } from 'lucide-react'
import PodcastTabs from '@/components/PodcastTabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Home() {
  const features = [
    {
      icon: Globe,
      title: 'Universal Support',
      description: 'Extract audio from 900+ platforms including YouTube, Spotify, Apple Podcasts, and more',
      color: 'from-podcast-500 to-podcast-600',
    },
    {
      icon: Mic,
      title: 'AI Transcription',
      description: 'Multi-language transcription with Google Gemini 2.5 Flash and auto-detection',
      color: 'from-audio-500 to-audio-600',
    },
    {
      icon: Brain,
      title: 'Smart Analysis',
      description: 'AI-powered summaries, insights, and mindmaps using advanced language models',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: MessageCircle,
      title: 'Interactive Chat',
      description: 'Chat with your podcast content using AI with full context and citations',
      color: 'from-purple-500 to-purple-600',
    },
  ]

  const platformLogos = [
    { name: 'YouTube', color: 'text-red-400' },
    { name: 'Spotify', color: 'text-green-400' },
    { name: 'Apple Podcasts', color: 'text-purple-400' },
    { name: 'SoundCloud', color: 'text-orange-400' },
    { name: 'Xiaoyuzhou', color: 'text-blue-400' },
    { name: 'BiliBili', color: 'text-pink-400' },
  ]



  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-podcast-500 to-audio-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Podcast Analyzer</h1>
                <p className="text-sm text-slate-400">AI-Powered Analysis</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Play className="w-4 h-4 mr-2" />
              Demo
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl font-bold mb-6 gradient-text">
              Transform Any Podcast Into
              <br />
              <span className="text-white">Actionable Insights</span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Extract, transcribe, and analyze podcasts from 900+ platforms with AI-powered 
              summaries, mindmaps, and interactive chat. Just paste a URL and get started.
            </p>
          </motion.div>

          {/* Podcast Tabs Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full mb-12"
          >
            <PodcastTabs />
          </motion.div>

          {/* Platform Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 mb-16"
          >
            <p className="text-sm text-slate-400 w-full mb-4">
              Supports 900+ platforms including:
            </p>
            {platformLogos.map((platform, index) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className={`text-sm font-medium ${platform.color} hover:scale-110 transition-transform cursor-pointer`}
              >
                {platform.name}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl font-bold mb-4 text-white">Powerful Features</h3>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Everything you need to extract maximum value from podcast content
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="card-hover h-full bg-slate-800 border-slate-700 hover:border-slate-600">
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-slate-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-podcast-500 to-audio-500 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-white">Podcast Analyzer</span>
            </div>
            <div className="text-sm text-slate-400">
              Built with Next.js, deployed on Railway
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 