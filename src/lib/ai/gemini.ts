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
        responseMimeType: 'application/json', // Force JSON output
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
 * Extract and clean JSON from AI response with multiple fallback strategies
 */
function extractJSON(content: string): string {
  let jsonContent = content.trim();
  
  // Strategy 1: Extract from markdown code blocks
  const codeBlockMatch = jsonContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonContent = codeBlockMatch[1].trim();
  } else if (jsonContent.startsWith('```')) {
    // Handle incomplete markdown blocks
    jsonContent = jsonContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```$/, '').trim();
  }
  
  // Strategy 2: Find JSON object/array boundaries
  const firstBrace = jsonContent.indexOf('{');
  const firstBracket = jsonContent.indexOf('[');
  
  // Determine if it's an object or array
  let startPos = -1;
  let isObject = true;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startPos = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startPos = firstBracket;
    isObject = false;
  }
  
  if (startPos !== -1) {
    jsonContent = jsonContent.substring(startPos);
  }
  
  // Strategy 3: Find last complete closing delimiter
  const lastBrace = jsonContent.lastIndexOf('}');
  const lastBracket = jsonContent.lastIndexOf(']');
  
  let endPos = -1;
  if (isObject && lastBrace !== -1) {
    endPos = lastBrace + 1;
  } else if (!isObject && lastBracket !== -1) {
    endPos = lastBracket + 1;
  } else {
    // Fallback: use the last available delimiter
    endPos = Math.max(lastBrace, lastBracket) + 1;
  }
  
  if (endPos > 0) {
    jsonContent = jsonContent.substring(0, endPos);
  }
  
  return jsonContent;
}

/**
 * Attempt to repair incomplete JSON
 * Handles common issues like:
 * - Missing closing quotes in strings
 * - Missing closing brackets/braces
 * - Trailing commas
 * - Unmatched brackets vs braces
 */
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;
  
  // Remove trailing commas before closing brackets/braces
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Count opening and closing delimiters
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  
  // Track delimiter stack to close in correct order
  const stack: string[] = [];
  let inString = false;
  let escapeNext = false;
  
  // Parse to build correct closing sequence
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      stack.push('}');
    } else if (char === '[') {
      stack.push(']');
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }
  
  // Add missing closures in reverse stack order
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  
  return repaired;
}

/**
 * Generate structured JSON completion with robust error handling and retry logic
 */
export async function generateStructuredCompletion<T = unknown>(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<{ data: T; usage?: CompletionResult['usage']; model: string }> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  let lastResponse: string | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Adjust temperature for retries (lower = more deterministic)
      const retryOptions = {
        ...options,
        temperature: attempt === 1 ? options.temperature : Math.max(0.3, (options.temperature || 0.7) - (attempt - 1) * 0.2),
        maxTokens: attempt > 1 ? Math.min((options.maxTokens || 4096) * 1.5, 8192) : options.maxTokens, // Increase max tokens on retry
      };
      
      if (attempt > 1) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} with temperature ${retryOptions.temperature}`);
        
        // Add instruction to ensure complete JSON on retry
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'user') {
          messages[messages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content + '\n\nIMPORTANT: Return ONLY valid, complete JSON. Do not truncate arrays or objects. Ensure all brackets and braces are properly closed.',
          };
        }
      }
      
      const result = await generateCompletion(messages, retryOptions);
      lastResponse = result.content;
      
      // Try multiple parsing strategies
      const strategies = [
        // Strategy 1: Extract and clean JSON
        () => {
          const extracted = extractJSON(result.content);
          return JSON.parse(extracted) as T;
        },
        // Strategy 2: Repair and parse
        () => {
          const extracted = extractJSON(result.content);
          const repaired = repairJSON(extracted);
          return JSON.parse(repaired) as T;
        },
        // Strategy 3: Direct parse (original content)
        () => {
          return JSON.parse(result.content) as T;
        },
      ];
      
      for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        try {
          const data = strategies[strategyIndex]();
          
          if (attempt > 1 || strategyIndex > 0) {
            console.log(`✅ JSON parsed successfully using strategy ${strategyIndex + 1} on attempt ${attempt}`);
          }
          
          return {
            data,
            usage: result.usage,
            model: result.model,
          };
        } catch (parseError) {
          if (strategyIndex === strategies.length - 1) {
            // Last strategy failed, throw to outer catch
            throw parseError;
          }
          // Try next strategy
          continue;
        }
      }
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
      } else {
        console.error('❌ All retry attempts exhausted');
        if (lastResponse) {
          console.error('Last AI response:', lastResponse.substring(0, 500));
        }
        console.error('Parse error:', lastError);
      }
    }
  }
  
  // All retries failed
  throw new Error(`AI returned invalid JSON format after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
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
