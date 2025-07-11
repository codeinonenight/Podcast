import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Podcast Analyzer - AI-Powered Podcast Analysis',
  description: 'Extract, transcribe, and analyze podcasts from 900+ platforms with AI-powered insights, summaries, and chat interface.',
  keywords: ['podcast', 'analysis', 'transcription', 'AI', 'audio', 'OpenAI', 'Azure Speech'],
  authors: [{ name: 'Podcast Analyzer Team' }],
  creator: 'Podcast Analyzer',
  publisher: 'Podcast Analyzer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://podcast-analyzer.up.railway.app'),
  openGraph: {
    type: 'website',
    title: 'Podcast Analyzer - AI-Powered Podcast Analysis',
    description: 'Extract, transcribe, and analyze podcasts from 900+ platforms with AI-powered insights.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://podcast-analyzer.up.railway.app',
    siteName: 'Podcast Analyzer',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Podcast Analyzer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcast Analyzer - AI-Powered Podcast Analysis',
    description: 'Extract, transcribe, and analyze podcasts from 900+ platforms with AI-powered insights.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-screen bg-background">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-podcast-50 via-background to-audio-50 opacity-50" />
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: 'hsl(var(--primary-foreground))',
                },
              },
              error: {
                iconTheme: {
                  primary: 'hsl(var(--destructive))',
                  secondary: 'hsl(var(--destructive-foreground))',
                },
              },
            }}
          />
        </div>
      </body>
    </html>
  )
} 