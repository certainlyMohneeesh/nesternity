import { IProvider } from '@/lib/ai/provider';
import { ChatMessage, CompletionOptions, CompletionResult, generateCompletion, generateStructuredCompletion } from '@/lib/ai/gemini';

export class GeminiProvider implements IProvider {
  async generateCompletion(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    return generateCompletion(messages, options);
  }

  async generateStructuredCompletion<T = unknown>(messages: ChatMessage[], options?: CompletionOptions): Promise<{ data: T; usage?: CompletionResult['usage']; model: string }> {
    return generateStructuredCompletion<T>(messages, options);
  }

  // Note: Gemini currently doesn't expose a dedicated embeddings endpoint in this wrapper
  async embedText(texts: string[]): Promise<number[][]> {
    // Not implemented - return null to indicate not supported directly
    return null as unknown as number[][];
  }

  async searchEmbeddings(query: string, topK: number = 5) {
    // Not available
    return [] as Array<{ id: string; score: number; metadata?: Record<string, any> }>;
  }

  async healthCheck(): Promise<boolean> {
    // We could call a lightweight Gemini endpoint but here return true for availability
    return true;
  }
}

export default GeminiProvider;
