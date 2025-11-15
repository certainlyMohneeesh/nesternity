import fetch from 'node-fetch';
import provider from './provider';
import { indexDocument as vectorIndexDocument } from './vector';
import { prisma } from '@/lib/db';

export async function embedText(texts: string[]): Promise<number[][]> {
  const embedService = process.env.EMBED_SERVICE_URL;
  // Prefer provider embed if available
  if (provider.embedText) {
    try {
      const r = await provider.embedText(texts);
      if (r) return r;
    } catch (err) {
      console.warn('provider.embedText error:', (err as any)?.message ?? err);
    }
  }

  if (embedService) {
    const res = await fetch(`${embedService}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) throw new Error(`Embed service returned ${res.status}`);
    const json: any = await res.json();
    return json?.embeddings ?? [];
  }

  throw new Error('No embed service available (set EMBED_SERVICE_URL or ensure provider.embedText)');
}

export function chunkText(text: string, chunkSize = 1000) {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    out.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return out;
}

export async function indexTextChunks(namespace: string, title: string, text: string, metadata: Record<string, any> = {}, chunkSize = 2000) {
  const chunks = chunkText(text, chunkSize);
  const embeddings = await embedText(chunks);

  for (let i = 0; i < chunks.length; i++) {
    const id = `${namespace}:${title}:${i}`;
    try {
      // Use vector index adapter to store metadata; also insert into prisma table if needed
      await vectorIndexDocument({ id, orgId: metadata.orgId, projectId: metadata.projectId, docType: namespace, docId: metadata.docId, vector: embeddings[i], content: chunks[i] });
      // Optionally insert into a dedicated documents table for search by content (if present)
      try {
        // Insert document with embedding into the documents table. Use vector literal cast for the embedding.
        const vectorLiteral = `[${embeddings[i].join(',')}]`;
        await prisma.$executeRawUnsafe(`INSERT INTO documents (id, namespace, title, content, metadata, embedding, created_at) VALUES ($1, $2, $3, $4, $5, $6::vector, now()) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`, id, namespace, title, chunks[i], JSON.stringify(metadata), vectorLiteral);
      } catch (err) {
        // ignore if table does not exist
      }
    } catch (err) {
      console.warn('Index chunk failed for id', id, (err as any)?.message ?? err);
    }
  }
}
