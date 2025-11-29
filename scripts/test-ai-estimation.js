#!/usr/bin/env node

/**
 * Test AI Budget Estimation Feature
 * This simulates a client request to estimate a proposal budget
 */

const fetch = require('node-fetch');

const testProposal = {
  title: "E-commerce Website MVP Development",
  brief: "Build a modern e-commerce platform with product catalog, shopping cart, checkout, and payment integration. Target audience is small to medium-sized businesses. Focus on user experience and mobile responsiveness.",
  deliverables: [
    {
      item: "UI/UX Design",
      description: "Complete design system with wireframes, high-fidelity mockups, and interactive prototypes for all pages",
      timeline: "2 weeks"
    },
    {
      item: "Frontend Development",
      description: "React-based responsive frontend with product listing, cart functionality, and checkout flow",
      timeline: "4 weeks"
    },
    {
      item: "Backend & Database",
      description: "Node.js API, PostgreSQL database, user authentication, and order management system",
      timeline: "3 weeks"
    },
    {
      item: "Payment Integration",
      description: "Stripe/Razorpay payment gateway integration with webhook handling",
      timeline: "1 week"
    },
    {
      item: "Testing & Deployment",
      description: "Quality assurance, bug fixes, and production deployment with documentation",
      timeline: "2 weeks"
    }
  ],
  timeline: [
    {
      name: "Discovery & Design Phase",
      duration: "2 weeks",
      deliverables: ["Requirements analysis", "Wireframes", "Design system"]
    },
    {
      name: "Development Phase",
      duration: "6 weeks",
      deliverables: ["Frontend development", "Backend API", "Database setup"]
    },
    {
      name: "Integration & Testing",
      duration: "2 weeks",
      deliverables: ["Payment integration", "QA testing", "Bug fixes"]
    },
    {
      name: "Launch & Handover",
      duration: "2 weeks",
      deliverables: ["Deployment", "Documentation", "Training"]
    }
  ],
  currency: "INR"
};

async function testBudgetEstimation() {
  console.log('🧪 Testing AI Budget Estimation API\n');
  console.log('📋 Test Proposal:');
  console.log(`   Title: ${testProposal.title}`);
  console.log(`   Deliverables: ${testProposal.deliverables.length}`);
  console.log(`   Timeline Phases: ${testProposal.timeline.length}`);
  console.log(`   Currency: ${testProposal.currency}\n`);

  console.log('🚀 Sending request to /api/ai/estimate-budget...\n');

  try {
    const response = await fetch('http://localhost:3000/api/ai/estimate-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProposal),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', data);
      console.log('\nNote: Make sure:');
      console.log('  1. Next.js dev server is running (npm run dev)');
      console.log('  2. You are logged in to the app');
      console.log('  3. GEMINI_API_KEY is set in .env');
      return;
    }

    console.log('✅ Estimation received!\n');
    console.log('💰 BUDGET ESTIMATION RESULTS');
    console.log('═'.repeat(50));
    
    const est = data.estimation;
    console.log(`\n💵 Estimated Budget: ${testProposal.currency} ${est.estimatedBudget.toLocaleString()}`);
    console.log(`📊 Confidence Level: ${est.confidence.toUpperCase()}`);
    
    console.log('\n📝 Rationale:');
    console.log(est.rationale);
    
    console.log('\n💡 Cost Breakdown:');
    est.breakdown.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.category}`);
      console.log(`   Amount: ${testProposal.currency} ${item.amount.toLocaleString()}`);
      console.log(`   Reasoning: ${item.reasoning}`);
    });

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Test completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure Next.js dev server is running: npm run dev');
  }
}

testBudgetEstimation();
