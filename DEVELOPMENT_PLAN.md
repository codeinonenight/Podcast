# Podcast Analysis Tool - Development Plan

## Project Overview
Build a comprehensive podcast analysis tool that accepts URLs from various platforms (Apple Podcasts, YouTube, Spotify, etc.), extracts audio, transcribes it using Azure Speech Service, and provides AI-powered insights using OpenRouter API.

## Core Features
1. **Universal Platform Support**: 900+ platforms via yt-dlp + specialized extractors
2. **Hybrid Audio Extraction**: yt-dlp for most platforms + Selenium for complex sites (Xiaoyuzhou)
3. **Multi-language Transcription**: Azure Speech Service with auto-detection
4. **AI-Powered Analysis**: Summary, mindmaps, and chat interface using OpenRouter
5. **Modern UI**: React-based interface with sophisticated, responsive design
6. **Railway Deployment**: Full-stack deployment on Railway with yt-dlp support

## Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: shadcn/ui + Tailwind CSS + Framer Motion
- **State Management**: Zustand for global state
- **File Upload**: react-dropzone for drag-and-drop
- **Charts/Mindmaps**: D3.js for mindmap visualization
- **Audio**: Custom audio player with waveform visualization

### Backend
- **Runtime**: Node.js with Next.js API routes
- **Audio Processing**: ffmpeg for audio format conversion
- **Universal Extraction**: yt-dlp for 900+ platforms (YouTube, Spotify, SoundCloud, etc.)
- **Specialized Extraction**: Selenium/Puppeteer for complex sites (Xiaoyuzhou, protected content)
- **Transcription**: Azure Speech Service SDK with multi-language support
- **LLM Integration**: OpenRouter API (GPT-4, Claude, Gemini)
- **Database**: PostgreSQL (Railway managed)
- **File Storage**: Railway disk storage with cleanup

### Infrastructure
- **Platform**: Railway (full-stack deployment)
- **Database**: Railway PostgreSQL
- **File Storage**: Railway disk storage
- **Background Jobs**: Railway cron jobs for cleanup
- **Domain**: Railway custom domain support

## Project Structure
```
podcast-analyzer/
├── README.md
├── next.config.js
├── package.json
├── tailwind.config.js
├── components.json
├── .env.local
├── .env.example
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── api/
│   │   ├── extract-audio/
│   │   │   └── route.ts
│   │   ├── transcribe/
│   │   │   └── route.ts
│   │   ├── analyze/
│   │   │   └── route.ts
│   │   ├── chat/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   └── dashboard/
│       └── page.tsx
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   └── ...
│   ├── URLInput.tsx
│   ├── AudioPlayer.tsx
│   ├── TranscriptionViewer.tsx
│   ├── SummaryDisplay.tsx
│   ├── MindmapViewer.tsx
│   ├── ChatInterface.tsx
│   └── ProcessingStatus.tsx
├── lib/
│   ├── utils.ts
│   ├── extractors/
│   │   ├── universal-extractor.ts      # yt-dlp based
│   │   ├── xiaoyuzhou-extractor.ts     # Selenium based
│   │   ├── spotify-extractor.ts        # API + yt-dlp hybrid
│   │   └── extractor-factory.ts        # Route to appropriate extractor
│   ├── transcription-service.ts
│   ├── ai-analyzer.ts
│   ├── openrouter-client.ts
│   └── types.ts
├── hooks/
│   ├── use-processing-status.ts
│   ├── use-audio-player.ts
│   └── use-chat.ts
├── utils/
│   ├── url-validator.ts
│   ├── platform-detector.ts
│   └── file-utils.ts
├── public/
│   └── assets/
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── PLATFORMS.md
```

## Phase 1: Core Infrastructure (Week 1-2)

### 1.1 Project Setup
- [x] Initialize Next.js project with TypeScript
- [x] Configure Tailwind CSS and shadcn/ui
- [x] Set up environment variables
- [x] Create basic project structure

### 1.2 URL Input & Platform Detection
- [x] Build URL input component with validation
- [x] Implement comprehensive platform detection logic
- [x] Support major platforms: YouTube, Xiaoyuzhou, Spotify, Apple Podcasts, SoundCloud
- [x] Add URL format validation and preview
- [x] Create platform-specific UI indicators

### 1.3 Audio Extraction Foundation
- [x] Set up yt-dlp integration for universal platform support
- [x] Implement Selenium-based extractor for Xiaoyuzhou (from reference code)
- [x] Create extractor factory for routing different platforms
- [x] Build unified audio extraction API endpoint
- [x] Implement progress tracking across all extractors
- [x] Add comprehensive error handling and logging

## Phase 2: Audio Processing (Week 2-3)

### 2.1 Audio Extraction Enhancement
- [x] Integrate all reference extractors (yt2doc, Xiaoyuzhou, ytDownloader patterns)
- [x] Implement chapter detection and merging (from media_info_extractor.py)
- [x] Add support for multiple audio formats (m4a/mp3/wav priority)
- [x] Implement audio format conversion with ffmpeg
- [x] Add audio file validation and metadata extraction
- [x] Support playlist extraction for podcast series

### 2.2 Azure Speech Service Integration
- [x] Set up Azure Speech Service SDK
- [x] Implement transcription API endpoint
- [x] Add multi-language support
- [x] Implement chunked processing for large files
- [x] Add progress tracking for transcription

### 2.3 File Management
- [x] Implement temporary file storage
- [x] Add file cleanup mechanisms
- [x] Create file size and duration limits
- [x] Add download progress tracking

## Phase 3: AI Analysis (Week 3-4)

### 3.1 OpenRouter Integration
- [x] Set up OpenRouter API client
- [x] Implement text summarization
- [x] Create content analysis prompts
- [x] Add error handling and rate limiting

### 3.2 Content Analysis Features
- [x] Generate text summaries (short, medium, long)
- [x] Extract key topics and themes
- [x] Identify speakers and participants
- [x] Create chapter/section breakdown
- [x] Generate mindmap data structure

### 3.3 Mindmap Generation
- [x] Design mindmap data structure
- [x] Implement mindmap visualization (D3.js or vis.js)
- [x] Add interactive mindmap features
- [x] Export mindmap as image/PDF

## Phase 4: Chat Interface (Week 4-5)

### 4.1 Chat Backend
- [x] Create chat API endpoint
- [x] Implement context management
- [x] Add conversation history
- [x] Integrate with OpenRouter for responses

### 4.2 Chat UI
- [x] Build chat interface component
- [x] Add message history display
- [x] Implement typing indicators
- [x] Add copy/share functionality

### 4.3 Chat Features
- [x] Context-aware responses
- [x] Quote-specific passages
- [x] Ask about specific timestamps
- [x] Generate follow-up questions

## Phase 5: UI/UX Polish (Week 5-6)

### 5.1 Dashboard Design
- [x] Create main dashboard layout
- [x] Add responsive design
- [x] Implement loading states
- [x] Add progress indicators

### 5.2 Component Enhancement
- [x] Polish URL input with platform icons
- [x] Enhanced audio player with waveform
- [x] Interactive transcript viewer
- [x] Collapsible summary sections

### 5.3 User Experience
- [x] Add keyboard shortcuts
- [x] Implement dark/light mode
- [x] Add accessibility features
- [x] Create mobile-responsive design

## Phase 6: Extended Platform Support (Week 6-7)

### 6.1 Platform Expansion (Leveraging Full yt-dlp Support)
- [x] Comprehensive yt-dlp integration (900+ platforms)
- [x] Chinese platforms: Xiaoyuzhou, BiliBili, iQiyi (Selenium + yt-dlp)
- [x] Social media: TikTok, Instagram, Facebook, Twitter/X
- [x] News/Media: BBC, CNN, NPR, podcasts from news outlets
- [x] Educational: Khan Academy, Coursera, Udemy audio content
- [x] Live streaming: Twitch VODs, YouTube Live archives
- [x] Regional platforms: European, Asian, African podcast platforms

### 6.2 Specialized Extraction Features
- [x] Selenium-based extraction for JavaScript-heavy sites (like Xiaoyuzhou)
- [x] Cookie support for authenticated content
- [x] Proxy support for geo-restricted content
- [x] Platform-specific metadata extraction and optimization
- [x] Custom User-Agent strings for different platforms
- [x] Rate limiting and respectful crawling

## Phase 7: Railway Deployment & Optimization (Week 7-8)

### 7.1 Railway Deployment Setup
- [x] **Docker Configuration**: Multi-stage Dockerfile with Python + Node.js
- [x] **Database Setup**: Railway PostgreSQL with migrations
- [x] **Environment Config**: Railway environment variables
- [x] **Domain Setup**: Custom domain configuration
- [x] **Monitoring**: Railway logs and metrics integration

### 7.2 Production Optimization
- [x] Implement Redis caching for processed results
- [x] Add background job processing for long-running tasks
- [x] Optimize Docker image size and build times
- [x] Configure Railway auto-scaling
- [x] Add health checks and monitoring

### 7.3 Performance & Monitoring
- [x] Implement error tracking (Sentry integration)
- [x] Add usage analytics and metrics
- [x] Create health check endpoints
- [x] Add Railway-specific performance monitoring
- [x] Configure automated backups

## Technical Specifications

### Audio Extraction
- **Supported Formats**: MP3, WAV, M4A, OGG
- **Max File Size**: 100MB
- **Max Duration**: 3 hours
- **Quality**: 44.1kHz, 16-bit minimum

### Transcription
- **Service**: Azure Speech Service
- **Languages**: Auto-detect + 20+ supported languages
- **Accuracy**: Optimized for podcast/speech content
- **Processing**: Chunked for large files

### AI Analysis
- **Provider**: OpenRouter API
- **Models**: GPT-4, Claude, Gemini (user selectable)
- **Features**: Summarization, Q&A, mindmaps
- **Context**: Full transcript + metadata

### Platform Support Matrix
| Platform Category | Examples | Extraction Method | Metadata | Auth Required |
|------------------|----------|------------------|----------|--------------|
| **Video Platforms** | YouTube, Vimeo, Dailymotion | ✅ yt-dlp | ✅ Full | ❌ None |
| **Chinese Platforms** | Xiaoyuzhou, BiliBili, iQiyi | ✅ Selenium + yt-dlp | ✅ Full | ❌ None |
| **Podcast Platforms** | Apple Podcasts, Spotify, SoundCloud | ✅ yt-dlp + RSS | ✅ Rich | ⚠️ Some |
| **Social Media** | TikTok, Instagram, Twitter/X | ✅ yt-dlp | ✅ Basic | ❌ None |
| **News/Media** | BBC, CNN, NPR, Al Jazeera | ✅ yt-dlp | ✅ Full | ❌ None |
| **Educational** | Khan Academy, Coursera, Udemy | ✅ yt-dlp | ✅ Full | ⚠️ Some |
| **Live/Streaming** | Twitch VODs, YouTube Live | ✅ yt-dlp | ✅ Full | ❌ None |
| **Regional** | European, Asian, African platforms | ✅ yt-dlp + Custom | ✅ Variable | ⚠️ Variable |

**Total Supported Platforms: 900+ via yt-dlp + specialized extractors**

## Deployment Architecture

### **Railway Full-Stack Deployment**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Railway Platform                         │
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐             │
│  │   Next.js Frontend  │    │   API Backend       │             │
│  │                     │    │                     │             │
│  │ • React Components  │────▶│ • yt-dlp + FFmpeg   │             │
│  │ • Sophisticated UI  │    │ • Selenium/Chrome   │             │
│  │ • State Management  │    │ • Python Runtime    │             │
│  │ • Real-time Updates │    │ • Audio Processing  │             │
│  └─────────────────────┘    └─────────────────────┘             │
│                                       │                         │
│  ┌─────────────────────┐              │                         │
│  │   PostgreSQL DB     │◄─────────────┘                         │
│  │                     │                                        │
│  │ • Session Data      │                                        │
│  │ • Processing Queue  │                                        │
│  │ • User Preferences  │                                        │
│  │ • Analytics Data    │                                        │
│  └─────────────────────┘                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────┐
                   │   External APIs     │
                   │                     │
                   │ • Azure Speech      │
                   │ • OpenRouter LLM    │
                   │ • Platform APIs     │
                   └─────────────────────┘
```

### **Why Railway Full-Stack?**

1. **Unified Deployment**:
   - Single platform for frontend + backend
   - No complex routing between services
   - Simplified CI/CD pipeline

2. **Full Runtime Support**:
   - Python runtime for yt-dlp
   - FFmpeg binary support
   - Selenium + Chrome for complex sites
   - Long execution times for large files

3. **Cost Efficiency**:
   - Single service cost (~$5-20/month)
   - No data transfer costs between services
   - Managed PostgreSQL included

4. **Developer Experience**:
   - Git-based deployments
   - Built-in monitoring and logs
   - Easy scaling and configuration

### **Railway Configuration**:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Python and system dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg chromium

# Install yt-dlp and Selenium
RUN pip3 install yt-dlp selenium

# Set Chrome binary path
ENV CHROME_BIN=/usr/bin/chromium-browser

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### **Environment Variables (Railway)**:
```bash
# Database (Auto-provided by Railway)
DATABASE_URL=postgresql://...

# Azure Speech Service
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=eastus

# OpenRouter API
OPENROUTER_API_KEY=your_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
MAX_FILE_SIZE_MB=100
MAX_DURATION_MINUTES=180

# Processing Configuration
PYTHON_PATH=/usr/bin/python3
FFMPEG_PATH=/usr/bin/ffmpeg
CHROME_BIN=/usr/bin/chromium-browser
TEMP_DIR=/tmp/audio_processing
```

## API Endpoints

### POST /api/extract-audio
- **Input**: { url: string, platform?: string }
- **Output**: { audioUrl: string, metadata: object, duration: number }

### POST /api/transcribe
- **Input**: { audioUrl: string, language?: string }
- **Output**: { transcription: string, confidence: number, segments: array }

### POST /api/analyze
- **Input**: { transcription: string, analysisType: string }
- **Output**: { summary: string, topics: array, mindmap: object }

### POST /api/chat
- **Input**: { message: string, context: string, history: array }
- **Output**: { response: string, sources: array }

## Key Reusable Components from Ref

1. **Universal Audio Extraction** (`media_info_extractor.py`)
   - yt-dlp integration for 900+ platforms
   - Chapter detection and intelligent merging
   - Format prioritization (m4a/bestaudio/best)
   - Playlist and batch processing support

2. **Specialized Platform Extraction** (`download.py`)
   - Selenium-based extraction for Xiaoyuzhou
   - Progress tracking with callback functions
   - Headless browser configuration
   - Error handling for complex sites

3. **Advanced Processing** (`extractor.py`, `formatter.py`)
   - Chaptered transcript generation
   - Timestamp linking and navigation
   - Multi-format output (txt, srt, markdown)
   - Caching strategies for repeated access

4. **Desktop Application Patterns** (`ytDownloader-main/`)
   - Electron app architecture for cross-platform support
   - Background processing workflows
   - User preference management
   - Auto-updater integration

5. **UI/UX Patterns** (`app.py`)
   - Progress tracking with visual indicators
   - Expandable sections for workflow steps
   - File management and download controls
   - Error messaging and user feedback

## Success Metrics
- Support for 900+ platforms via yt-dlp + specialized extractors
- Universal compatibility with major podcast platforms
- 95%+ transcription accuracy across multiple languages
- <30 second processing time for 10-minute podcasts
- Seamless handling of Chinese platforms (Xiaoyuzhou, BiliBili)
- Mobile-responsive design with sophisticated UI
- Successful Railway deployment with full functionality

## Railway Deployment Checklist

### Pre-deployment
- [ ] Docker image builds successfully
- [ ] All environment variables configured
- [ ] Database migrations ready
- [ ] yt-dlp and FFmpeg working in container
- [ ] Selenium/Chrome functional

### Deployment
- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] Database provisioned
- [ ] Custom domain configured

### Post-deployment
- [ ] Health checks passing
- [ ] Audio extraction working
- [ ] Transcription service functional
- [ ] AI analysis endpoints responding
- [ ] UI loading and responsive

## Risk Mitigation
- **Platform Changes**: Modular extraction architecture
- **API Rate Limits**: Implement queueing and backoff
- **Large Files**: Chunked processing with progress tracking
- **Storage Costs**: Implement cleanup and temporary storage

## Future Enhancements (Post-Launch)
- Batch processing for multiple URLs
- User accounts and history
- Advanced analytics and insights
- Integration with note-taking apps
- Podcast recommendation system
- Multi-language UI support

---

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`
5. Follow the deployment guide in `docs/DEPLOYMENT.md`

This development plan provides a comprehensive roadmap for building your podcast analysis tool, leveraging the existing reference code while creating a modern, scalable application ready for Cloudflare deployment.