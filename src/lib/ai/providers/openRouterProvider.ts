import { IProvider } from '@/lib/ai/provider';
import { ChatMessage, CompletionOptions, CompletionResult } from '@/lib/ai/types';
import { extractJSON, repairJSON } from '@/lib/ai/utils';

export class OpenRouterProvider implements IProvider {
    private apiKey = process.env.OPENROUTER_API_KEY || '';
    private defaultModel = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp';
    private siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    private siteName = 'Nesternity';

    async generateCompletion(messages: ChatMessage[], options: CompletionOptions = {}): Promise<CompletionResult> {
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not set');
        }

        const model = options.model || this.defaultModel;
        const temperature = options.temperature ?? 0.7;
        const maxTokens = options.maxTokens;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json',
        };

        const body: any = {
            model,
            messages,
            temperature,
        };

        if (maxTokens) {
            body.max_tokens = maxTokens;
        }

        if (options.responseFormat) {
            body.response_format = options.responseFormat;
        }

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const content = choice?.message?.content || '';

            return {
                content,
                usage: {
                    promptTokens: data.usage?.prompt_tokens || 0,
                    completionTokens: data.usage?.completion_tokens || 0,
                    totalTokens: data.usage?.total_tokens || 0,
                },
                model: data.model || model,
            };
        } catch (error) {
            console.error('❌ OpenRouter completion error:', error);
            throw error;
        }
    }

    async generateStructuredCompletion<T = unknown>(
        messages: ChatMessage[],
        options: CompletionOptions = {}
    ): Promise<{ data: T; usage?: CompletionResult['usage']; model: string }> {
        const maxRetries = 3;
        let lastError: Error | null = null;
        let lastResponse: string | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Adjust temperature for retries
                const retryOptions = {
                    ...options,
                    temperature: attempt === 1 ? options.temperature : Math.max(0.3, (options.temperature || 0.7) - (attempt - 1) * 0.2),
                };

                if (attempt > 1) {
                    console.log(`🔄 Retry attempt ${attempt}/${maxRetries} with temperature ${retryOptions.temperature}`);

                    // Add instruction to ensure complete JSON on retry
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage && lastMessage.role === 'user') {
                        // Clone messages to avoid mutating the original array
                        const newMessages = [...messages];
                        newMessages[newMessages.length - 1] = {
                            ...lastMessage,
                            content: lastMessage.content + '\n\nIMPORTANT: Return ONLY valid, complete JSON. Do not truncate arrays or objects. Ensure all brackets and braces are properly closed.',
                        };
                        messages = newMessages;
                    }
                }

                const result = await this.generateCompletion(messages, retryOptions);
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
                    // Strategy 3: Direct parse
                    () => {
                        return JSON.parse(result.content) as T;
                    },
                ];

                for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
                    try {
                        const data = strategies[strategyIndex]();
                        return {
                            data,
                            usage: result.usage,
                            model: result.model,
                        };
                    } catch (parseError) {
                        if (strategyIndex === strategies.length - 1) {
                            throw parseError;
                        }
                        continue;
                    }
                }
            } catch (error) {
                lastError = error as Error;
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}. Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt - 1), 5000)));
                }
            }
        }

        throw new Error(`AI returned invalid JSON format after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    }

    async embedText(texts: string[]): Promise<number[][]> {
        // OpenRouter doesn't have a standard embeddings endpoint that works for all models.
        // Some models might support it via specific endpoints, but for now we'll return empty
        // or rely on a fallback if configured.
        // If the user specifically needs embeddings, they should use a dedicated provider or 
        // we can implement a specific OpenRouter model that supports it.
        // For now, returning null to let the system fallback to other methods if available.
        return null as unknown as number[][];
    }

    async searchEmbeddings(query: string, topK: number = 5) {
        return [];
    }

    async healthCheck(): Promise<boolean> {
        try {
            // Simple check to see if we can reach OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.ok;
        } catch (err) {
            return false;
        }
    }
}

export default OpenRouterProvider;
