import provider from '@/lib/ai/provider';
import { ChatMessage, CompletionOptions, generateStructuredCompletion as geminiStructuredCompletion } from './gemini';
import { embedText, indexTextChunks } from './embeddings';
import { retrieveRelevantDocs } from './retriever';

interface AdapterOptions extends CompletionOptions {
  ragTopK?: number;
  ragEnabled?: boolean;
}

export async function generateStructuredCompletion<T = unknown>(
  messages: ChatMessage[],
  options: AdapterOptions = {}
): Promise<{ data: T; usage?: any; model: string }> {
  const { ragEnabled = process.env.AI_RAG_ENABLED === 'true', ragTopK = 5 } = options;

  if (!ragEnabled) {
      return await provider.generateStructuredCompletion<T>(messages, options);
  }

  // RAG enabled: embed the user's last message and retrieve relevant docs
  const lastUser = messages.slice().reverse().find(m => m.role === 'user');
  if (!lastUser) {
      return await provider.generateStructuredCompletion<T>(messages, options);
  }

  const queryText = lastUser.content;
  let embeddings: number[][] | null = null;
  try {
    embeddings = await embedText([queryText]);
  } catch (err) {
    // embedText could throw various errors; make sure TS doesn't complain about unknown error type
    console.warn('embedText failed in adapter RAG:', (err as any)?.message ?? err);
  }

  // If we got embeddings, retrieve relevant docs
  let retrieved: Array<{ id: string; content: string; metadata?: any }> = [];
  if (embeddings && embeddings[0]) {
    const res = await retrieveRelevantDocs(embeddings[0], ragTopK);
    retrieved = res || [];
  }

  // Augment the system message with retrieved contexts
  const contextStr = retrieved.map(r => `=== Retrieved: ${r.id} ===\n${r.content}\n`).join('\n');
  const augmentedMessages: ChatMessage[] = messages.map(m => ({ ...m }));
  if (contextStr.length > 0) {
    // Insert a system message at the front with retrieved context
    augmentedMessages.unshift({ role: 'system', content: `RETRIEVED CONTEXT:\n${contextStr}` });
  }

    // Ensure provider health (if available) before generation to provide a clearer error message
    if (typeof provider.healthCheck === 'function') {
      try {
        const healthy = await provider.healthCheck();
        if (!healthy) {
          throw new Error('Local provider is not healthy. Ensure the generator service is running and reachable (AI_MODEL_ENDPOINT).');
        }
      } catch (err) {
        throw new Error((err as any)?.message || 'Local provider health check failed');
      }
    }

    // Call the provider generator with augmented messages. We are using in-house provider only.
    return await provider.generateStructuredCompletion<T>(augmentedMessages, options);
}

export default { generateStructuredCompletion };
