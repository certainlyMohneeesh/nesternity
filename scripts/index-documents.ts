import { prisma } from '@/lib/db';
import { indexTextChunks } from '@/lib/ai/embeddings';

async function indexProposals() {
  console.log('Starting indexing proposals...');
  const proposals = await prisma.proposal.findMany({ where: {}, take: 1000 });
  for (const p of proposals) {
    try {
      const text = (p.brief || p.sectionBlocks || '').toString();
      const title = p.title || p.id;
      await indexTextChunks('proposal', title, text, { orgId: p.organisationId, projectId: p.projectId, docId: p.id });
      console.log(`Indexed proposal ${p.id}`);
    } catch (err) {
      console.warn('Failed to index proposal', p.id, (err as any)?.message ?? err);
    }
  }
}

async function main() {
  try {
    await indexProposals();
    console.log('Indexing complete');
  } catch (err) {
    console.error('Indexing failed:', (err as any)?.message ?? err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
