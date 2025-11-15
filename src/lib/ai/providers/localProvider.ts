import fetch from 'node-fetch';
import type { IProvider } from '@/lib/ai/provider';
import { ChatMessage, CompletionOptions, CompletionResult } from '@/lib/ai/gemini';

/**
 * LocalProvider - uses a local model endpoint (TGI, llama.cpp, or hosted TGI) for generation and embeddings.
 *
 * This is a lightweight skeleton; the specific endpoints depend on the chosen server.
 * For test/dev, the environment variable AI_MODEL_ENDPOINT should be set to the TGI endpoint.
 */
export class LocalProvider implements IProvider {
  private endpoint = process.env.AI_MODEL_ENDPOINT || 'http://localhost:8080';

  async generateCompletion(messages: ChatMessage[], options?: CompletionOptions): Promise<CompletionResult> {
    const prompt = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');

    const payload: any = {
      prompt,
      max_new_tokens: options?.maxTokens || 512,
      temperature: options?.temperature ?? 0.7,
    };

    const res = await fetch(`${this.endpoint}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Local model generate failed: ${res.statusText}`);
    }

    const json: any = await res.json();
    const text = (json?.text || json?.generated_text || json?.result || '').toString();

    return {
      content: text,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: Math.ceil(text.length / 4),
        totalTokens: Math.ceil((prompt.length + text.length) / 4),
      },
      model: process.env.AI_LOCAL_MODEL || 'local-model',
    } as CompletionResult;
  }

  async generateStructuredCompletion<T = unknown>(messages: ChatMessage[], options?: CompletionOptions) {
    // Reuse generateCompletion and attempt to parse JSON as gemini did
    const result = await this.generateCompletion(messages, options);
    // Attempt to JSON.parse safely; if fail, throw error for retry logic to be handled by callers
    try {
      const data = JSON.parse(result.content) as T;
      return { data, usage: result.usage, model: result.model };
    } catch (e) {
      throw new Error('Local provider returned invalid JSON');
    }
  }

  async embedText(texts: string[]): Promise<number[][]> {
    const embedEndpoint = process.env.EMBED_SERVICE_URL || this.endpoint;
    const res = await fetch(`${embedEndpoint}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!res.ok) {
      throw new Error(`Local model embed failed: ${res.statusText}`);
    }

    const json: any = await res.json();
    // The response shape depends on the server; this expects { embeddings: [[...], [...]] }
    return json?.embeddings ?? [];
  }

  async searchEmbeddings(query: string, topK: number = 5) {
    // Local provider won't hold a search index; expect a separate vector DB to do search.
    return [];
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/health`);
      return res.ok;
    } catch (err) {
      console.warn('LocalProvider healthCheck failed:', (err as any)?.message ?? err);
      return false;
    }
  }
}

export default LocalProvider;
