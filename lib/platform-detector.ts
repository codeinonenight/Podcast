import { Globe, Video, Music, Mic, Radio, Tv, Headphones, PlayCircle } from 'lucide-react'

export interface PlatformInfo {
  name: string
  icon: any
  color: string
  description: string
  extractorType: 'yt-dlp' | 'selenium' | 'api' | 'rss'
  supportedFeatures: string[]
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