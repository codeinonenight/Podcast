# 🎙️ Podcast Analysis Tool

A comprehensive AI-powered podcast analysis platform that extracts, transcribes, and analyzes audio content from 900+ platforms including YouTube, Spotify, Apple Podcasts, Xiaoyuzhou, and more.

## ✨ Features

### 🌐 Universal Platform Support
- **900+ Platforms**: YouTube, Spotify, Apple Podcasts, SoundCloud, Xiaoyuzhou, BiliBili, and more
- **Smart Detection**: Automatic platform identification and optimal extraction method selection
- **Real-time Processing**: Live progress tracking with detailed status updates

### 🎯 AI-Powered Analysis
- **Fast Transcription**: Azure Speech Service Fast API with language identification (30+ languages)
- **Word-level Timestamps**: Precise timing information for each word and segment
- **Comprehensive Analysis**: AI-generated summaries, topic extraction, mindmaps, and insights
- **Interactive Chat**: Chat with your podcast content using advanced LLM integration
- **Structured Insights**: Key topics, themes, and actionable takeaways

### 🎨 Modern Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live progress tracking with animated status indicators
- **Sophisticated UI**: Built with shadcn/ui, Tailwind CSS, and Framer Motion
- **Intuitive UX**: Drag-and-drop file upload, URL validation, and smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- PostgreSQL database
- Azure Speech Service account
- OpenRouter API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd podcast-analysis-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your API keys and configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/podcast_db"
   
   # Azure Speech Service
   AZURE_SPEECH_KEY="your-azure-speech-key"
   AZURE_SPEECH_REGION="your-azure-region"
   
   # OpenRouter API
   OPENROUTER_API_KEY="your-openrouter-api-key"
   
   # Railway Configuration
   RAILWAY_STATIC_URL="https://your-app.railway.app"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: App Router with TypeScript
- **shadcn/ui**: Modern component library
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Zustand**: State management

### Backend
- **Node.js**: API routes and server logic
- **Prisma**: Database ORM with PostgreSQL
- **yt-dlp**: Universal audio extraction (900+ platforms)
- **Selenium**: Complex site handling (Xiaoyuzhou, etc.)
- **FFmpeg**: Audio processing and conversion

### AI Services
- **Azure Speech Service**: Fast transcription API with language identification
- **OpenRouter API**: AI analysis with Gemini Flash Lite Preview
- **Custom Analysis Pipeline**: Structured content insights

### Infrastructure
- **Railway**: Full-stack deployment platform
- **Docker**: Containerized deployment
- **PostgreSQL**: Production database

## 📋 API Reference

### Audio Extraction
```typescript
POST /api/extract
{
  "url": "https://youtube.com/watch?v=...",
  "sessionId": "unique-session-id"
}
```

### Transcription
```typescript
POST /api/transcribe
{
  "audioPath": "/path/to/audio.mp3",
  "sessionId": "unique-session-id"
}
```

### AI Analysis
```typescript
POST /api/analyze
{
  "transcription": "Full transcript text...",
  "sessionId": "unique-session-id"
}
```

### Interactive Chat
```typescript
POST /api/chat
{
  "message": "What are the main topics discussed?",
  "sessionId": "unique-session-id"
}
```

## 🐳 Docker Deployment

### Build the image
```bash
docker build -t podcast-analysis-tool .
```

### Run locally
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e AZURE_SPEECH_KEY="your-key" \
  -e OPENROUTER_API_KEY="your-key" \
  podcast-analysis-tool
```

## 🚂 Railway Deployment

### Automatic Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Environment Variables
Set these in your Railway dashboard:
- `DATABASE_URL`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `OPENROUTER_API_KEY`
- `RAILWAY_STATIC_URL`

## 🔧 Configuration

### Supported Platforms
The tool supports 900+ platforms through yt-dlp, including:
- **Video**: YouTube, Vimeo, Dailymotion, TikTok
- **Audio**: Spotify, SoundCloud, Apple Podcasts
- **Podcasts**: RSS feeds, Podcast platforms
- **Chinese**: Xiaoyuzhou, BiliBili, Tencent Video
- **And many more...**

### Transcription Languages
Supported languages include:
- English (en-US, en-GB, en-AU, en-CA)
- Chinese (zh-CN, zh-TW, zh-HK)
- Spanish (es-ES, es-MX)
- French (fr-FR, fr-CA)
- German (de-DE)
- Japanese (ja-JP)
- Korean (ko-KR)
- Arabic (ar-SA, ar-EG)
- And 20+ more languages with automatic detection

## 🧪 Testing

### Run tests
```bash
npm test
```

### Test specific components
```bash
npm test -- --testNamePattern="AudioExtraction"
```

### Test the complete pipeline
```bash
npm run test:pipeline
```

## 📊 Performance

### Optimization Features
- **Chunked Processing**: Large files processed in segments
- **Parallel Processing**: Multiple extraction methods simultaneously
- **Caching**: Intelligent caching of results and metadata
- **Cleanup**: Automatic temporary file cleanup
- **Progress Tracking**: Real-time status updates

### Benchmarks
- **Audio Extraction**: 1-5 minutes depending on platform
- **Fast Transcription**: ~30 seconds per 10 minutes of audio (up to 100MB files)
- **AI Analysis**: 30-60 seconds for comprehensive insights
- **Chat Responses**: 2-5 seconds per query

## 🔐 Security

### Data Protection
- **Temporary Storage**: Audio files automatically deleted after processing
- **Secure APIs**: All API endpoints properly authenticated
- **Environment Variables**: Sensitive data stored securely
- **Input Validation**: Comprehensive URL and input sanitization

### Privacy
- **No Permanent Storage**: Audio content not permanently stored
- **Session-based**: All data tied to temporary sessions
- **Configurable Cleanup**: Customizable data retention policies

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks for quality

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **yt-dlp**: Universal media extraction
- **Azure Speech Service**: High-quality transcription
- **OpenRouter**: AI analysis capabilities
- **shadcn/ui**: Beautiful UI components
- **Railway**: Seamless deployment platform

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Check the documentation
- Review existing discussions

---

**Built with ❤️ for podcast enthusiasts and content creators** 