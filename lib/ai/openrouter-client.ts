const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL_ID = 'google/gemini-2.5-flash-lite-preview-06-17'
const API_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

export interface OpenRouterResponse {
  success: boolean
  content?: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StructuredResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  confidence?: number
}

export class OpenRouterClient {
  private apiKey: string
  private modelId: string

  constructor(apiKey?: string, modelId?: string) {
    this.apiKey = apiKey || OPENROUTER_API_KEY || ''
    this.modelId = modelId || MODEL_ID
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required')
    }
  }

  async callOpenRouter(
    userMessage: string, 
    systemPrompt: string = 'You are a helpful assistant.',
    options: {
      maxTokens?: number
      temperature?: number
      topP?: number
    } = {}
  ): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://podcast-analyzer.com',
          'X-Title': 'Podcast Analyzer',
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: options.maxTokens || 2000,
          temperature: options.temperature || 0.7,
          top_p: options.topP || 0.9
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        content: data.choices[0]?.message?.content,
        usage: data.usage
      }
    } catch (error) {
      console.error('OpenRouter error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getStructuredResponse<T = any>(
    prompt: string,
    jsonSchema: string,
    systemPrompt?: string
  ): Promise<StructuredResponse<T>> {
    const fullSystemPrompt = `${systemPrompt || 'You are a helpful assistant.'}\n\nIMPORTANT: Respond with valid JSON only. ${jsonSchema}`
    
    const response = await this.callOpenRouter(prompt, fullSystemPrompt, {
      temperature: 0.3 // Lower temperature for more consistent JSON output
    })
    
    if (!response.success) {
      return {
        success: false,
        error: response.error
      }
    }

    try {
      const parsedData = JSON.parse(response.content || '{}')
      return {
        success: true,
        data: parsedData,
        confidence: parsedData.confidence || 0.8
      }
    } catch (parseError) {
      // Try to extract JSON from the response if it's wrapped in other text
      const jsonMatch = response.content?.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0])
          return {
            success: true,
            data: parsedData,
            confidence: parsedData.confidence || 0.7
          }
        } catch {}
      }
      
      // Fallback: return the raw response
      return {
        success: true,
        data: { answer: response.content, confidence: 0.6 } as T,
        confidence: 0.6
      }
    }
  }

  async generateSummary(transcription: string, metadata?: any): Promise<StructuredResponse<{
    summary: string
    keyPoints: string[]
    duration: string
    confidence: number
  }>> {
    const prompt = `
Please analyze this podcast transcription and provide a comprehensive summary.

${metadata ? `
Metadata:
- Title: ${metadata.title || 'Unknown'}
- Author: ${metadata.author || 'Unknown'}
- Duration: ${metadata.duration ? Math.round(metadata.duration / 60) + ' minutes' : 'Unknown'}
` : ''}

Transcription:
${transcription}

Please provide a detailed summary with key takeaways.
`

    const jsonSchema = `
Format your response as JSON with this structure:
{
  "summary": "A comprehensive 2-3 paragraph summary of the podcast content",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "..."],
  "duration": "Estimated reading time",
  "confidence": 0.95
}
`

    return this.getStructuredResponse(prompt, jsonSchema, 'You are an expert at analyzing and summarizing podcast content.')
  }

  async extractTopics(transcription: string): Promise<StructuredResponse<{
    topics: Array<{
      name: string
      relevance: number
      description: string
      timestamps?: string[]
    }>
    categories: string[]
    confidence: number
  }>> {
    const prompt = `
Analyze this podcast transcription and extract the main topics and themes discussed.

Transcription:
${transcription}

Identify the key topics, their relevance scores (0-1), and brief descriptions.
`

    const jsonSchema = `
Format your response as JSON with this structure:
{
  "topics": [
    {
      "name": "Topic name",
      "relevance": 0.95,
      "description": "Brief description of what this topic covers",
      "timestamps": ["00:05:30", "00:12:45"]
    }
  ],
  "categories": ["Category1", "Category2", "Category3"],
  "confidence": 0.9
}
`

    return this.getStructuredResponse(prompt, jsonSchema, 'You are an expert at topic extraction and content analysis.')
  }

  async generateMindmap(transcription: string, metadata?: any): Promise<StructuredResponse<{
    centralTopic: string
    branches: Array<{
      name: string
      subtopics: string[]
      connections: string[]
    }>
    confidence: number
  }>> {
    const prompt = `
Create a mindmap structure for this podcast content. Identify the central theme and organize related concepts into branches.

${metadata ? `Title: ${metadata.title || 'Podcast'}` : ''}

Transcription:
${transcription}

Create a hierarchical mindmap structure with a central topic and connected branches.
`

    const jsonSchema = `
Format your response as JSON with this structure:
{
  "centralTopic": "Main central theme of the podcast",
  "branches": [
    {
      "name": "Branch topic name",
      "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
      "connections": ["Related branch names"]
    }
  ],
  "confidence": 0.9
}
`

    return this.getStructuredResponse(prompt, jsonSchema, 'You are an expert at creating structured knowledge maps and organizing information hierarchically.')
  }

  async generateInsights(transcription: string, metadata?: any): Promise<StructuredResponse<{
    insights: Array<{
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
      category: string
    }>
    actionableAdvice: string[]
    quotableQuotes: string[]
    confidence: number
  }>> {
    const prompt = `
Analyze this podcast and extract valuable insights, actionable advice, and memorable quotes.

${metadata ? `
Metadata:
- Title: ${metadata.title || 'Unknown'}
- Author: ${metadata.author || 'Unknown'}
` : ''}

Transcription:
${transcription}

Extract key insights, practical advice, and notable quotes from the content.
`

    const jsonSchema = `
Format your response as JSON with this structure:
{
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description of the insight",
      "impact": "high",
      "category": "business/personal/technical/etc"
    }
  ],
  "actionableAdvice": ["Actionable advice 1", "Actionable advice 2"],
  "quotableQuotes": ["Notable quote 1", "Notable quote 2"],
  "confidence": 0.9
}
`

    return this.getStructuredResponse(prompt, jsonSchema, 'You are an expert at extracting valuable insights and practical advice from content.')
  }

  async answerQuestion(question: string, transcription: string, metadata?: any): Promise<StructuredResponse<{
    answer: string
    confidence: number
    sources: string[]
    relatedTopics: string[]
  }>> {
    const prompt = `
Based on this podcast content, please answer the following question:

Question: ${question}

${metadata ? `
Podcast Info:
- Title: ${metadata.title || 'Unknown'}
- Author: ${metadata.author || 'Unknown'}
` : ''}

Transcription:
${transcription}

Provide a detailed answer based on the podcast content.
`

    const jsonSchema = `
Format your response as JSON with this structure:
{
  "answer": "Detailed answer to the question based on the podcast content",
  "confidence": 0.9,
  "sources": ["Relevant excerpts from the transcript"],
  "relatedTopics": ["Related topics mentioned in the podcast"]
}
`

    return this.getStructuredResponse(prompt, jsonSchema, 'You are an expert at answering questions based on podcast content. Only use information from the provided transcript.')
  }

  // Utility method for chat-like interactions
  async chat(message: string, context: string, conversationHistory?: Array<{role: string, content: string}>): Promise<OpenRouterResponse> {
    const systemPrompt = `You are a helpful assistant discussing a podcast. Use the following context to inform your responses:

Context:
${context}

Previous conversation history is provided in the messages. Be conversational and helpful.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ]

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://podcast-analyzer.com',
          'X-Title': 'Podcast Analyzer',
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        content: data.choices[0]?.message?.content,
        usage: data.usage
      }
    } catch (error) {
      console.error('OpenRouter chat error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}

// Export a default instance
export const openRouterClient = new OpenRouterClient() 