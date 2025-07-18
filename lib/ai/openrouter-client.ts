const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const MODEL_ID = 'google/gemini-2.5-flash-lite-preview-06-17'
const API_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Check if we should use mock mode - only when no API key is available
const USE_MOCK_AI = !process.env.OPENROUTER_API_KEY

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
    
    if (!this.apiKey && !USE_MOCK_AI) {
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
    if (USE_MOCK_AI) {
      console.log('🔧 Mock AI: No OpenRouter API key available, using mock AI response')
      return await this.mockOpenRouterCall(userMessage, systemPrompt, options)
    }

    console.log('🔧 OpenRouter: Using real API for AI analysis')

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

  private async mockOpenRouterCall(
    userMessage: string, 
    systemPrompt: string,
    options: any
  ): Promise<OpenRouterResponse> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Detect language from the transcription content
    const detectedLanguage = this.detectLanguageFromContent(userMessage)
    
    // Generate mock response based on the prompt content
    let mockContent = ''
    
    if (userMessage.includes('summary') || userMessage.includes('summarize')) {
      mockContent = JSON.stringify(this.generateMockSummary(detectedLanguage))
    } else if (userMessage.includes('topics') || userMessage.includes('extract')) {
      mockContent = JSON.stringify({
        topics: [
          {
            name: "Artificial Intelligence",
            relevance: 0.95,
            description: "Discussion of AI applications and implications",
            timestamps: ["00:02:30", "00:15:45", "00:28:10"]
          },
          {
            name: "Technology Ethics",
            relevance: 0.88,
            description: "Ethical considerations in technology development",
            timestamps: ["00:08:20", "00:22:15"]
          },
          {
            name: "Industry Transformation",
            relevance: 0.82,
            description: "How technology is changing various industries",
            timestamps: ["00:12:00", "00:25:30"]
          }
        ],
        categories: ["Technology", "Ethics", "Innovation", "Future Trends"],
        confidence: 0.89
      })
    } else if (userMessage.includes('mindmap')) {
      mockContent = JSON.stringify({
        centralTopic: "Technology and Human Creativity",
        branches: [
          {
            name: "Artificial Intelligence",
            subtopics: ["Machine Learning", "Natural Language Processing", "Computer Vision"],
            connections: ["Ethics", "Innovation"]
          },
          {
            name: "Industry Applications",
            subtopics: ["Healthcare", "Education", "Entertainment"],
            connections: ["AI", "Future Trends"]
          },
          {
            name: "Ethical Considerations",
            subtopics: ["Privacy", "Bias", "Transparency"],
            connections: ["AI", "Human Oversight"]
          }
        ],
        confidence: 0.87
      })
    } else if (userMessage.includes('insights')) {
      mockContent = JSON.stringify({
        insights: [
          {
            title: "AI Augmentation Over Replacement",
            description: "The most successful AI implementations focus on augmenting human capabilities rather than replacing them entirely",
            impact: "high",
            category: "Strategy"
          },
          {
            title: "Ethical Framework Necessity",
            description: "Organizations need robust ethical frameworks before implementing AI solutions",
            impact: "high",
            category: "Ethics"
          },
          {
            title: "Continuous Learning Culture",
            description: "Teams must develop a culture of continuous learning to adapt to technological changes",
            impact: "medium",
            category: "Culture"
          }
        ],
        actionableAdvice: [
          "Start with small AI pilot projects to understand capabilities and limitations",
          "Invest in team training and development programs",
          "Establish clear ethical guidelines for AI use",
          "Focus on problems that truly benefit from AI solutions"
        ],
        quotableQuotes: [
          "Technology is best when it brings people together",
          "The future belongs to those who can adapt and learn continuously",
          "Ethics must be built into technology from the ground up"
        ],
        confidence: 0.91
      })
    } else {
      // Default response for questions or chat
      mockContent = `Based on the podcast content, this appears to be a thoughtful discussion about technology and its impact on society. The hosts provide balanced perspectives on both opportunities and challenges. 

Key themes include:
- The importance of human-centered design in technology
- Practical applications across various industries
- Ethical considerations in AI development
- Strategies for adapting to technological change

This content would be valuable for anyone interested in understanding how technology is shaping our future while maintaining focus on human values and needs.`
    }

    console.log('🔧 Mock AI: Generated response for', userMessage.includes('JSON') ? 'structured' : 'text', 'request in', detectedLanguage)

    return {
      success: true,
      content: mockContent,
      usage: {
        prompt_tokens: Math.floor(userMessage.length / 4),
        completion_tokens: Math.floor(mockContent.length / 4),
        total_tokens: Math.floor((userMessage.length + mockContent.length) / 4)
      }
    }
  }

  private detectLanguageFromContent(content: string): string {
    // Simple language detection based on character patterns
    const chineseChars = /[\u4e00-\u9fff]/g
    const japaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/g
    const koreanChars = /[\uac00-\ud7af]/g
    
    const chineseMatches = content.match(chineseChars)
    const japaneseMatches = content.match(japaneseChars)
    const koreanMatches = content.match(koreanChars)
    
    if (chineseMatches && chineseMatches.length > 10) return 'zh-CN'
    if (japaneseMatches && japaneseMatches.length > 10) return 'ja-JP'
    if (koreanMatches && koreanMatches.length > 10) return 'ko-KR'
    
    return 'en-US'
  }

  private generateMockSummary(language: string): any {
    const summaries: Record<string, any> = {
      'zh-CN': {
        summary: "本期播客节目深入探讨了科技与人类创造力的迷人交汇点。主持人讨论了人工智能如何革命性地改变各个行业，同时强调了保持人类监督和伦理考量的重要性。他们涵盖了医疗保健、教育和娱乐领域的实际应用，为听众提供了关于适应技术变革的可行见解。",
        keyPoints: [
          "人工智能正在同时改变多个行业",
          "人类监督在AI实施中仍然至关重要",
          "伦理考量必须指导技术进步",
          "实际应用在医疗保健和教育领域已经可见",
          "适应策略对专业人士来说是必不可少的"
        ],
        duration: "5-7分钟阅读时间",
        confidence: 0.92
      },
      'ja-JP': {
        summary: "このポッドキャストエピソードは、テクノロジーと人間の創造性の魅力的な交差点を探求しています。ホストは、人工知能がさまざまな業界をどのように革命化しているかについて議論し、同時に人間の監督と倫理的考慮の重要性を強調しています。彼らは医療、教育、エンターテイメントにおける実用的な応用を取り上げ、技術的変化に適応することについての実行可能な洞察をリスナーに提供しています。",
        keyPoints: [
          "AIは複数の業界を同時に変革している",
          "AI実装において人間の監督は依然として重要",
          "倫理的考慮が技術進歩を導く必要がある",
          "実用的な応用は医療と教育ですでに見られる",
          "適応戦略は専門家にとって不可欠"
        ],
        duration: "5-7分読書時間",
        confidence: 0.92
      },
      'en-US': {
        summary: "This podcast episode explores the fascinating intersection of technology and human creativity. The hosts discuss how artificial intelligence is revolutionizing various industries while emphasizing the importance of maintaining human oversight and ethical considerations. They cover practical applications in healthcare, education, and entertainment, providing listeners with actionable insights about adapting to technological change.",
        keyPoints: [
          "AI is transforming multiple industries simultaneously",
          "Human oversight remains crucial in AI implementation",
          "Ethical considerations must guide technological advancement",
          "Practical applications are already visible in healthcare and education",
          "Adaptation strategies are essential for professionals"
        ],
        duration: "5-7 minutes reading time",
        confidence: 0.92
      }
    }
    
    return summaries[language] || summaries['en-US']
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