/**
 * Vector DB abstraction - minimal sample layer that can be extended to support pgvector, Redis, or Weaviate
 */
import { prisma } from '@/lib/db';

export interface VectorRecord {
  id: string;
  orgId?: string;
  projectId?: string;
  docType?: string;
  docId?: string;
  vector: number[];
  content: string;
  createdAt?: Date;
}

export async function indexDocument(record: VectorRecord): Promise<void> {
  // Basic pgvector example - this requires a table with a vector column
  // For now, we store metadata in a 'ai_index' table if present. If not, this is a no-op.
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO ai_index (id, org_id, project_id, doc_type, doc_id, content) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
    `, record.id, record.orgId || null, record.projectId || null, record.docType || null, record.docId || null, record.content || '');
    // Also insert into the documents table (with embedding) if present.
    try {
      const vectorLiteral = `[${record.vector.join(',')}]`;
      await prisma.$executeRawUnsafe(`INSERT INTO documents (id, namespace, title, content, metadata, embedding, created_at) VALUES ($1, $2, $3, $4, $5, $6::vector, now()) ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`, record.id, record.docType || null, record.docId || null, record.content || '', JSON.stringify({ orgId: record.orgId, projectId: record.projectId }), vectorLiteral);
    } catch (err) {
      // optional; if documents table not present, silently skip
    }
  } catch (error) {
    // If table does not exist, ignore silently; logs can be added as needed
    console.debug('Indexing to ai_index not performed:', (error as any)?.message ?? error);
  }
}

export async function search(queryEmbedding: number[], k: number = 5): Promise<Array<{ id: string; score: number; metadata?: any }>> {
  // Placeholder: return empty results. Implementations should call pgvector query or external vector DB.
  return [];
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM ai_index WHERE id = $1`, id);
  } catch (error) {
    console.debug('ai_index delete skipped:', (error as any)?.message ?? error);
  }
}

export default { indexDocument, search, deleteDocument };
