import { prisma } from '@/lib/db';

export async function retrieveRelevantDocs(queryVec: number[], topK: number = 5): Promise<Array<{ id: string; content: string; metadata?: any }>> {
  // Convert vector to SQL representation for pgvector: e.g. '[0.1,0.2,0.3]'
  const vectorLiteral = `[${queryVec.join(',')}]`;
  try {
    const rows: Array<any> = await prisma.$queryRawUnsafe(
      `SELECT id, title, content, metadata FROM documents ORDER BY embedding <-> $1::vector LIMIT $2`,
      vectorLiteral,
      topK
    );
    return rows.map(r => ({ id: r.id, content: r.content, metadata: r.metadata }));
  } catch (err) {
    // cast unknown errors for safer access to message in TS
    console.warn('retrieveRelevantDocs error', (err as any)?.message ?? err);
    return [];
  }
}

export default { retrieveRelevantDocs };
