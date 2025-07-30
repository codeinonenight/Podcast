import { NextResponse } from 'next/server'
import { SystemDetector } from '../../../lib/platform-detector'

export async function GET() {
  try {
    const systemPaths = SystemDetector.getSystemPaths()
    const platform = SystemDetector.getPlatform()
    
    // Basic health check
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      platform: platform,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        nodejs: true,
        python: 'unknown',
        ffmpeg: 'unknown',
        chrome: 'unknown'
      },
      paths: systemPaths
    }

    // Only run system checks in production/server environment
    if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
      // Check Python availability synchronously
      try {
        const { execSync } = require('child_process')
        const pythonCmd = platform === 'windows' ? 'python --version' : 'python3 --version'
        execSync(pythonCmd, { timeout: 5000 })
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
        healthData.services.chrome = SystemDetector.checkToolAvailability(systemPaths.chrome) ? 'available' : 'unavailable'
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