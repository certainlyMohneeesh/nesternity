const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProposalStatus() {
  try {
    console.log('🔍 Checking all proposals with signatures...\n');

    const proposals = await prisma.proposal.findMany({
      include: {
        signatures: {
          select: {
            id: true,
            signerName: true,
            signedAt: true,
          },
        },
        client: {
          select: {
            name: true,
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    proposals.forEach((proposal) => {
      console.log('📋 Proposal:', proposal.title);
      console.log('   Client:', proposal.client.company || proposal.client.name);
      console.log('   Status:', proposal.status);
      console.log('   Accepted At:', proposal.acceptedAt);
      console.log('   Signatures:', proposal.signatures.length);
      
      if (proposal.signatures.length > 0) {
        proposal.signatures.forEach((sig) => {
          console.log('   ✍️ Signed by:', sig.signerName);
          console.log('   📅 Signed at:', sig.signedAt);
        });
      }

      // Check for inconsistency
      if (proposal.signatures.length > 0 && proposal.status !== 'ACCEPTED') {
        console.log('   ⚠️  WARNING: Has signature but status is not ACCEPTED!');
        console.log('   🔧 Fixing...');
      }

      console.log('\n' + '-'.repeat(60) + '\n');
    });

    // Fix any inconsistencies
    const proposalsWithSigs = await prisma.proposal.findMany({
      where: {
        signatures: {
          some: {},
        },
        status: {
          not: 'ACCEPTED',
        },
      },
    });

    if (proposalsWithSigs.length > 0) {
      console.log(`\n🔧 Found ${proposalsWithSigs.length} proposals with signatures but wrong status. Fixing...`);
      
      for (const proposal of proposalsWithSigs) {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: proposal.acceptedAt || new Date(),
          },
        });
        console.log(`✅ Fixed: ${proposal.title}`);
      }
    } else {
      console.log('✅ All proposals with signatures have correct status!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProposalStatus();
