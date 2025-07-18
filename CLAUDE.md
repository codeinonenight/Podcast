# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a comprehensive AI-powered podcast analysis platform that extracts, transcribes, and analyzes audio content from 900+ platforms including YouTube, Spotify, Apple Podcasts, Xiaoyuzhou, and more. The platform provides AI-generated summaries, topic extraction, mindmaps, and interactive chat with podcast content.

## Development Commands

### Core Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Commands
```bash
# Initialize database
npm run db:init

# Push schema changes
npm run db:push

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio
```

### Testing
The project doesn't have specific test scripts in package.json. Check for test files in the project or ask the user about the testing approach.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Next.js API routes, Prisma ORM with SQLite database
- **AI Services**: Azure Speech Service for transcription, OpenRouter API for analysis
- **Audio Processing**: yt-dlp for universal extraction, Selenium for complex sites, FFmpeg for audio processing
- **State Management**: Zustand for client-side state

### Key Architecture Components

#### 1. Database Layer (`lib/database.ts`)
- **Dual Mode Support**: Can run with mock data (no database) or real PostgreSQL/SQLite
- **DatabaseService**: Centralized service for all database operations
- **ProcessingStatus**: Enum for tracking job stages (PENDING, EXTRACTING_AUDIO, TRANSCRIBING, ANALYZING, COMPLETED, FAILED)
- **Mock Mode**: Controlled by `USE_MOCK_DB` environment variable for development/testing

#### 2. Processing Pipeline (`lib/processing/audio-pipeline.ts`)
- **AudioProcessingPipeline**: Main orchestrator for the three-stage processing flow
- **Stages**: 
  1. Audio Extraction (0-60% progress)
  2. Transcription (60-90% progress)  
  3. AI Analysis (90-100% progress)
- **Progress Tracking**: Real-time progress updates with detailed status reporting
- **Error Handling**: Graceful failure handling that doesn't stop the entire pipeline

#### 3. Audio Extraction System
- **UniversalExtractor**: Uses yt-dlp for 900+ platforms
- **XiaoyuzhouExtractor**: Uses Selenium for complex sites requiring browser automation
- **Platform Detection**: Automatic platform identification and optimal extraction method selection

#### 4. API Routes (`app/api/`)
- **extract**: Handles audio extraction from URLs
- **transcribe**: Processes audio files through Azure Speech Service
- **analyze**: Generates AI-powered summaries, topics, mindmaps, and insights
- **chat**: Interactive chat with podcast content using OpenRouter

#### 5. Data Models (Prisma Schema)
- **PodcastSession**: Main entity storing all podcast processing data
- **ChatSession**: Stores chat conversations linked to podcast sessions
- **ProcessingJob**: Tracks processing job metadata and timing

### Important Implementation Details

#### Database Flexibility
The system supports both production database mode and mock mode for development. Check the `USE_MOCK_DB` environment variable to understand current mode.

#### Processing Flow
1. URL input → Platform detection → Extractor selection
2. Audio extraction → Metadata extraction → Database storage
3. Transcription with language auto-detection → Database update
4. AI analysis (summary, topics, mindmap, insights) → Final database update

#### Error Handling Strategy
- Each stage can fail independently without stopping the entire pipeline
- Transcription failures don't prevent analysis if transcript exists
- Analysis failures don't prevent completion of extraction/transcription
- All errors are logged and stored in database for debugging

#### AI Integration
- **Transcription**: Uses Google Gemini 2.5 Flash for audio transcription with advanced language understanding
- **Analysis**: Uses OpenRouter API with Gemini Flash Lite Preview model
- Modular analysis: summary, topics, mindmap, insights are generated separately
- Chat functionality maintains context using the full transcript

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (optional in mock mode)
- `GEMINI_API_KEY`: Google Gemini API key for transcription service
- `OPENROUTER_API_KEY`: OpenRouter API key for AI analysis
- `RAILWAY_STATIC_URL`: Base URL for deployed application (optional)
- `USE_MOCK_DB`: Set to 'true' to use mock database mode

## Key Files to Understand

- `lib/database.ts`: Database service layer with mock support
- `lib/processing/audio-pipeline.ts`: Core processing orchestration
- `lib/extractors/universal-extractor.ts`: yt-dlp integration
- `lib/extractors/xiaoyuzhou-extractor.ts`: Selenium-based extraction
- `lib/transcription/gemini-transcription.ts`: Gemini transcription service integration
- `lib/ai/openrouter-client.ts`: OpenRouter API integration
- `components/PodcastTabs.tsx`: Main UI component for podcast processing
- `prisma/schema.prisma`: Database schema definition

## Common Development Patterns

### Adding New Platforms
1. Update `lib/platform-detector.ts` to recognize the new platform
2. Choose between UniversalExtractor (yt-dlp) or create custom extractor
3. Test extraction and ensure metadata is properly extracted

### Extending AI Analysis
1. Add new analysis methods to `lib/ai/openrouter-client.ts`
2. Update the processing pipeline to include new analysis step
3. Add database fields to store new analysis results

### Database Schema Changes
1. Update `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` to apply schema changes
4. Update mock data structures in `lib/database.ts` if using mock mode

## Performance Considerations

- Audio files are automatically cleaned up after processing
- Database cleanup runs automatically for old failed sessions
- Progress tracking uses WebSocket-like updates for real-time UI
- Large audio files are processed in chunks to prevent memory issues
- Caching is implemented for metadata and analysis results