import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        nodejs: true,
        python: 'unknown',
        ffmpeg: 'unknown',
        chrome: 'unknown'
      }
    }

    // Only run system checks in production/server environment
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      // Check Python availability synchronously
      try {
        const { execSync } = require('child_process')
        execSync('python3 --version', { timeout: 5000 })
        healthData.services.python = 'available'
      } catch {
        healthData.services.python = 'unavailable'
      }

      // Check FFmpeg availability synchronously
      try {
        const { execSync } = require('child_process')
        execSync('ffmpeg -version', { timeout: 5000 })
        healthData.services.ffmpeg = 'available'
      } catch {
        healthData.services.ffmpeg = 'unavailable'
      }

      // Check Chrome availability
      try {
        const chromePath = process.env.CHROME_BIN || '/usr/bin/chromium-browser'
        const fs = require('fs')
        healthData.services.chrome = fs.existsSync(chromePath) ? 'available' : 'unavailable'
      } catch {
        healthData.services.chrome = 'unavailable'
      }
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
} 