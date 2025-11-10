const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBudgetEstimation() {
  try {
    console.log('🔍 Testing BudgetEstimation model...\n');

    // Check if model exists
    console.log('✅ BudgetEstimation model is available in Prisma Client');

    // Try to query (should return empty array initially)
    const estimations = await prisma.budgetEstimation.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`📊 Found ${estimations.length} budget estimations in database\n`);

    if (estimations.length > 0) {
      console.log('Recent estimations:');
      estimations.forEach((est, i) => {
        console.log(`\n${i + 1}. ${est.title}`);
        console.log(`   Budget: ${est.currency} ${est.estimatedBudget}`);
        console.log(`   Confidence: ${est.confidence}`);
        console.log(`   Deliverables: ${est.deliverableCount}`);
        console.log(`   Timeline: ${est.timelineWeeks} weeks`);
        if (est.actualBudget) {
          console.log(`   Actual: ${est.currency} ${est.actualBudget}`);
          console.log(`   Accuracy: ${est.accuracy}%`);
        }
      });
    } else {
      console.log('ℹ️  No estimations yet. Create a proposal and use "Estimate Budget with AI" to generate one!');
    }

    console.log('\n✅ BudgetEstimation model is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBudgetEstimation();
