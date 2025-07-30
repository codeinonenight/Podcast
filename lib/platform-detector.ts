import { Globe, Video, Music, Mic, Radio, Tv, Headphones, PlayCircle } from 'lucide-react'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

export interface PlatformInfo {
  name: string
  icon: any
  color: string
  description: string
  extractorType: 'yt-dlp' | 'selenium' | 'api' | 'rss'
  supportedFeatures: string[]
}

export interface SystemPaths {
  python: string
  ffmpeg: string
  ffprobe: string
  ytdlp: string
  chrome: string
  chromedriver: string
  tempDir: string
}

// 系统平台检测和路径配置
export class SystemDetector {
  static getPlatform(): 'windows' | 'macos' | 'linux' {
    const platform = os.platform()
    if (platform === 'win32') return 'windows'
    if (platform === 'darwin') return 'macos'
    return 'linux'
  }

  static getDefaultPaths(): SystemPaths {
    const platform = this.getPlatform()
    
    switch (platform) {
      case 'windows':
        const chromeOrEdge = this.findChromeInstallation() || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        return {
          python: 'python',
          ffmpeg: 'ffmpeg',
          ffprobe: 'ffprobe',
          ytdlp: 'yt-dlp',
          chrome: chromeOrEdge,
          chromedriver: path.join(process.cwd(), 'node_modules', 'chromedriver', 'lib', 'chromedriver', 'chromedriver.exe'),
          tempDir: path.join(os.tmpdir(), 'audio_processing')
        }
      
      case 'macos':
        return {
          python: '/usr/bin/python3',
          ffmpeg: '/opt/homebrew/bin/ffmpeg',
          ffprobe: '/opt/homebrew/bin/ffprobe',
          ytdlp: '/opt/homebrew/bin/yt-dlp',
          chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          chromedriver: path.join(process.cwd(), 'node_modules', 'chromedriver', 'lib', 'chromedriver', 'chromedriver'),
          tempDir: '/tmp/audio_processing'
        }
      
      default: // linux
        return {
          python: '/usr/bin/python3',
          ffmpeg: '/usr/bin/ffmpeg',
          ffprobe: '/usr/bin/ffprobe',
          ytdlp: '/usr/bin/yt-dlp',
          chrome: '/usr/bin/chromium-browser',
          chromedriver: path.join(process.cwd(), 'node_modules', 'chromedriver', 'lib', 'chromedriver', 'chromedriver'),
          tempDir: '/tmp/audio_processing'
        }
    }
  }

  static getSystemPaths(): SystemPaths {
    const defaultPaths = this.getDefaultPaths()
    
    return {
      python: process.env.PYTHON_PATH || defaultPaths.python,
      ffmpeg: process.env.FFMPEG_PATH || defaultPaths.ffmpeg,
      ffprobe: process.env.FFPROBE_PATH || defaultPaths.ffprobe,
      ytdlp: process.env.YTDLP_PATH || defaultPaths.ytdlp,
      chrome: process.env.CHROME_BIN || process.env.CHROME_PATH || defaultPaths.chrome,
      chromedriver: defaultPaths.chromedriver,
      tempDir: process.env.TEMP_DIR || defaultPaths.tempDir
    }
  }

  static checkToolAvailability(toolPath: string): boolean {
    try {
      // 对于不是绝对路径的工具（在PATH中的），我们假设它们可用
      if (!path.isAbsolute(toolPath)) {
        return true
      }
      return fs.existsSync(toolPath)
    } catch {
      return false
    }
  }

  static findChromeInstallation(): string | null {
    const platform = this.getPlatform()
    
    if (platform === 'windows') {
      const possiblePaths = [
        // Chrome路径
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        // Edge路径 (作为Chrome的替代)
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        path.join(process.env.PROGRAMFILES || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
      ]
      
      for (const browserPath of possiblePaths) {
        if (fs.existsSync(browserPath)) {
          console.log(`🔍 Browser found: ${browserPath}`)
          return browserPath
        }
      }
    }
    
    return null
  }

  static ensureTempDir(tempDir?: string): string {
    const dir = tempDir || this.getSystemPaths().tempDir
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      return dir
    } catch (error) {
      console.warn(`Failed to create temp directory ${dir}:`, error)
      // 回退到系统临时目录
      const fallbackDir = path.join(os.tmpdir(), 'podcast_analyzer')
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
      return fallbackDir
    }
  }
}

const platformPatterns: { [key: string]: PlatformInfo } = {
  'youtube.com': {
    name: 'YouTube',
    icon: Video,
    color: 'bg-red-500',
    description: 'Video platform with extensive podcast content',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'chapters', 'metadata', 'subtitles']
  },
  'youtu.be': {
    name: 'YouTube',
    icon: Video,
    color: 'bg-red-500',
    description: 'Video platform with extensive podcast content',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'chapters', 'metadata', 'subtitles']
  },
  'spotify.com': {
    name: 'Spotify',
    icon: Music,
    color: 'bg-green-500',
    description: 'Music and podcast streaming platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'chapters']
  },
  'podcasts.apple.com': {
    name: 'Apple Podcasts',
    icon: Headphones,
    color: 'bg-purple-500',
    description: 'Apple\'s podcast platform',
    extractorType: 'rss',
    supportedFeatures: ['audio', 'metadata', 'chapters', 'rss']
  },
  'itunes.apple.com': {
    name: 'Apple Podcasts',
    icon: Headphones,
    color: 'bg-purple-500',
    description: 'Apple\'s podcast platform',
    extractorType: 'rss',
    supportedFeatures: ['audio', 'metadata', 'chapters', 'rss']
  },
  'soundcloud.com': {
    name: 'SoundCloud',
    icon: PlayCircle,
    color: 'bg-orange-500',
    description: 'Audio sharing platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'waveform']
  },
  'xiaoyuzhou.fm': {
    name: 'Xiaoyuzhou',
    icon: Radio,
    color: 'bg-blue-500',
    description: 'Chinese podcast platform',
    extractorType: 'selenium',
    supportedFeatures: ['audio', 'metadata', 'chapters', 'chinese']
  },
  'xiaoyuzhoufm.com': {
    name: 'Xiaoyuzhou',
    icon: Radio,
    color: 'bg-blue-500',
    description: 'Chinese podcast platform',
    extractorType: 'selenium',
    supportedFeatures: ['audio', 'metadata', 'chapters', 'chinese']
  },
  'bilibili.com': {
    name: 'BiliBili',
    icon: Tv,
    color: 'bg-pink-500',
    description: 'Chinese video platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata', 'chinese']
  },
  'anchor.fm': {
    name: 'Anchor',
    icon: Mic,
    color: 'bg-purple-600',
    description: 'Podcast hosting platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'rss']
  },
  'overcast.fm': {
    name: 'Overcast',
    icon: Radio,
    color: 'bg-blue-600',
    description: 'Podcast player and platform',
    extractorType: 'rss',
    supportedFeatures: ['audio', 'metadata', 'chapters']
  },
  'pocketcasts.com': {
    name: 'Pocket Casts',
    icon: Headphones,
    color: 'bg-red-600',
    description: 'Podcast player and platform',
    extractorType: 'rss',
    supportedFeatures: ['audio', 'metadata', 'chapters']
  },
  'stitcher.com': {
    name: 'Stitcher',
    icon: Radio,
    color: 'bg-indigo-500',
    description: 'Podcast streaming platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata']
  },
  'castbox.fm': {
    name: 'Castbox',
    icon: Radio,
    color: 'bg-green-600',
    description: 'Podcast platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata']
  },
  'podbean.com': {
    name: 'Podbean',
    icon: Mic,
    color: 'bg-orange-600',
    description: 'Podcast hosting platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'rss']
  },
  'buzzsprout.com': {
    name: 'Buzzsprout',
    icon: Mic,
    color: 'bg-yellow-600',
    description: 'Podcast hosting platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'rss']
  },
  'libsyn.com': {
    name: 'Libsyn',
    icon: Mic,
    color: 'bg-blue-700',
    description: 'Podcast hosting platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'rss']
  },
  'megaphone.fm': {
    name: 'Megaphone',
    icon: Radio,
    color: 'bg-purple-700',
    description: 'Podcast hosting and analytics',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'analytics']
  },
  'simplecast.com': {
    name: 'Simplecast',
    icon: Radio,
    color: 'bg-teal-500',
    description: 'Podcast hosting platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'rss']
  },
  'audioboom.com': {
    name: 'Audioboom',
    icon: Radio,
    color: 'bg-red-700',
    description: 'Audio content platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata']
  },
  'spreaker.com': {
    name: 'Spreaker',
    icon: Radio,
    color: 'bg-orange-700',
    description: 'Podcast platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'metadata', 'live']
  },
  'twitch.tv': {
    name: 'Twitch',
    icon: Tv,
    color: 'bg-purple-800',
    description: 'Live streaming platform (VODs)',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'live', 'vod']
  },
  'vimeo.com': {
    name: 'Vimeo',
    icon: Video,
    color: 'bg-blue-800',
    description: 'Video platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'dailymotion.com': {
    name: 'Dailymotion',
    icon: Video,
    color: 'bg-blue-900',
    description: 'Video platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'facebook.com': {
    name: 'Facebook',
    icon: Globe,
    color: 'bg-blue-600',
    description: 'Social media platform (videos)',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'instagram.com': {
    name: 'Instagram',
    icon: Globe,
    color: 'bg-pink-600',
    description: 'Social media platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'tiktok.com': {
    name: 'TikTok',
    icon: Video,
    color: 'bg-gray-900',
    description: 'Short video platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'reddit.com': {
    name: 'Reddit',
    icon: Globe,
    color: 'bg-red-800',
    description: 'Social platform (videos)',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'twitter.com': {
    name: 'Twitter/X',
    icon: Globe,
    color: 'bg-black',
    description: 'Social media platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  },
  'x.com': {
    name: 'Twitter/X',
    icon: Globe,
    color: 'bg-black',
    description: 'Social media platform',
    extractorType: 'yt-dlp',
    supportedFeatures: ['audio', 'video', 'metadata']
  }
}

export function detectPlatform(url: string): PlatformInfo | null {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.replace('www.', '').toLowerCase()
    
    console.log('🔧 Platform Detection: URL:', url, 'Hostname:', hostname)
    
    // Direct match
    if (platformPatterns[hostname]) {
      console.log('🔧 Platform Detection: Direct match found:', platformPatterns[hostname].name)
      return platformPatterns[hostname]
    }
    
    // Partial match for subdomains
    for (const [pattern, info] of Object.entries(platformPatterns)) {
      if (hostname.includes(pattern) || pattern.includes(hostname)) {
        console.log('🔧 Platform Detection: Partial match found:', info.name, 'pattern:', pattern)
        return info
      }
    }
    
    // Generic fallback
    return {
      name: 'Generic',
      icon: Globe,
      color: 'bg-gray-500',
      description: 'Unknown platform - will attempt extraction',
      extractorType: 'yt-dlp',
      supportedFeatures: ['audio', 'metadata']
    }
  } catch {
    return null
  }
}

export function getPlatformCapabilities(platform: PlatformInfo): string[] {
  const capabilities: string[] = []
  
  if (platform.supportedFeatures.includes('audio')) {
    capabilities.push('Audio extraction')
  }
  
  if (platform.supportedFeatures.includes('video')) {
    capabilities.push('Video extraction')
  }
  
  if (platform.supportedFeatures.includes('chapters')) {
    capabilities.push('Chapter detection')
  }
  
  if (platform.supportedFeatures.includes('metadata')) {
    capabilities.push('Metadata extraction')
  }
  
  if (platform.supportedFeatures.includes('subtitles')) {
    capabilities.push('Subtitle extraction')
  }
  
  if (platform.supportedFeatures.includes('rss')) {
    capabilities.push('RSS feed support')
  }
  
  if (platform.supportedFeatures.includes('live')) {
    capabilities.push('Live stream support')
  }
  
  if (platform.supportedFeatures.includes('chinese')) {
    capabilities.push('Chinese language support')
  }
  
  return capabilities
}

export function getAllSupportedPlatforms(): PlatformInfo[] {
  return Object.values(platformPatterns)
}

export function getPlatformsByType(type: 'yt-dlp' | 'selenium' | 'api' | 'rss'): PlatformInfo[] {
  return Object.values(platformPatterns).filter(platform => platform.extractorType === type)
} 