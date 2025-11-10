/**
 * Google Gemini AI Client
 * Provides unified interface for AI completions with rate limiting and error handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

/**
 * Convert ChatMessage format to Gemini format
 */
function convertMessagesToGeminiFormat(messages: ChatMessage[]): string {
  // Gemini doesn't have a separate system role, so we'll combine system + user messages
  const systemMessages = messages.filter(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  let prompt = '';
  
  // Add system context first
  if (systemMessages.length > 0) {
    prompt += systemMessages.map(m => m.content).join('\n\n') + '\n\n';
  }
  
  // Add conversation history if any
  if (assistantMessages.length > 0) {
    prompt += 'Previous conversation:\n';
    for (let i = 0; i < Math.min(userMessages.length, assistantMessages.length); i++) {
      prompt += `User: ${userMessages[i].content}\n`;
      prompt += `Assistant: ${assistantMessages[i].content}\n\n`;
    }
  }
  
  // Add current user message
  const currentUserMessage = userMessages[userMessages.length - 1];
  if (currentUserMessage) {
    prompt += currentUserMessage.content;
  }
  
  return prompt;
}

/**
 * Generate AI completion using Google Gemini
 */
export async function generateCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const {
    model = process.env.AI_MODEL || 'gemini-2.0-flash-exp',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    const geminiModel = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const prompt = convertMessagesToGeminiFormat(messages);
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No content in AI response');
    }

    // Gemini doesn't provide detailed token usage in the same way
    // We'll estimate based on response
    const estimatedTokens = Math.ceil(text.length / 4); // Rough estimate

    return {
      content: text,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: estimatedTokens,
        totalTokens: Math.ceil(prompt.length / 4) + estimatedTokens,
      },
      model,
    };
  } catch (error) {
    console.error('❌ Gemini AI completion error:', error);
    throw new Error(`AI completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate structured JSON completion
 */
export async function generateStructuredCompletion<T = unknown>(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<{ data: T; usage?: CompletionResult['usage']; model: string }> {
  const result = await generateCompletion(messages, options);
  
  try {
    // Extract JSON from markdown code blocks if present
    let jsonContent = result.content.trim();
    
    // Try to extract JSON from markdown code blocks
    const jsonMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    } else if (jsonContent.startsWith('```')) {
      // Handle incomplete markdown blocks (response might be cut off)
      jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
    }
    
    // Remove any trailing incomplete JSON if response was cut off
    // Find the last complete closing brace/bracket
    const lastBrace = jsonContent.lastIndexOf('}');
    const lastBracket = jsonContent.lastIndexOf(']');
    const lastComplete = Math.max(lastBrace, lastBracket);
    
    if (lastComplete > -1 && lastComplete < jsonContent.length - 1) {
      // There's content after the last closing brace/bracket, likely incomplete
      jsonContent = jsonContent.substring(0, lastComplete + 1);
    }
    
    const data = JSON.parse(jsonContent) as T;
    return {
      data,
      usage: result.usage,
      model: result.model,
    };
  } catch (error) {
    console.error('❌ Failed to parse AI JSON response:', result.content);
    console.error('Parse error:', error);
    throw new Error('AI returned invalid JSON format');
  }
}

/**
 * Rate limiting helper - simple in-memory tracker
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  maxRequests: number = 20,
  windowMs: number = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = userId;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  
  // Increment count
  existing.count += 1;
  rateLimitMap.set(key, existing);
  
  return { 
    allowed: true, 
    remaining: maxRequests - existing.count, 
    resetAt: existing.resetAt 
  };
}
