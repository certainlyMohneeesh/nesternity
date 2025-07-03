// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Read .env file
try {
  const envPath = path.join(__dirname, '..', '.env');
  const envFile = fs.readFileSync(envPath, 'utf8');
  
  envFile.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').replace(/"/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.error('Error loading .env file:', error.message);
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test data...');

    // Create a test user (this should match a Supabase user ID)
    const testUser = await prisma.user.create({
      data: {
        id: 'test-user-id-123', // This should match a Supabase Auth user
        email: 'test@example.com',
        displayName: 'Test User'
      }
    });
    console.log('✓ Created test user:', testUser.email);

    // Create a test team
    const testTeam = await prisma.team.create({
      data: {
        id: 'test-team-id-123',
        name: 'Test Team',
        description: 'A test team for development',
        createdBy: testUser.id
      }
    });
    console.log('✓ Created test team:', testTeam.name);

    // Add user as team member
    await prisma.teamMember.create({
      data: {
        teamId: testTeam.id,
        userId: testUser.id,
        role: 'OWNER',
        addedBy: testUser.id,
        acceptedAt: new Date()
      }
    });
    console.log('✓ Added user to team');

    // Create a test client
    const testClient = await prisma.client.create({
      data: {
        name: 'Test Client Corp',
        email: 'client@testcorp.com',
        phone: '+1234567890',
        address: '123 Test Street, Test City, TC 12345',
        createdBy: testUser.id
      }
    });
    console.log('✓ Created test client:', testClient.name);

    // Create a test board
    const testBoard = await prisma.board.create({
      data: {
        name: 'Test Project Board',
        description: 'A test board for development',
        type: 'KANBAN',
        teamId: testTeam.id,
        createdBy: testUser.id,
        position: 0
      }
    });
    console.log('✓ Created test board:', testBoard.name);

    // Create test lists
    const todoList = await prisma.boardList.create({
      data: {
        name: 'To Do',
        boardId: testBoard.id,
        position: 0
      }
    });

    const inProgressList = await prisma.boardList.create({
      data: {
        name: 'In Progress',
        boardId: testBoard.id,
        position: 1
      }
    });

    const doneList = await prisma.boardList.create({
      data: {
        name: 'Done',
        boardId: testBoard.id,
        position: 2
      }
    });
    console.log('✓ Created test lists');

    // Create test tasks
    const tasks = [
      {
        title: 'Set up development environment',
        description: 'Install and configure all necessary tools',
        priority: 'HIGH',
        status: 'TODO',
        listId: todoList.id,
        position: 0
      },
      {
        title: 'Design user interface',
        description: 'Create mockups and wireframes',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        listId: inProgressList.id,
        position: 0
      },
      {
        title: 'Research project requirements',
        description: 'Gather and document all project requirements',
        priority: 'HIGH',
        status: 'DONE',
        listId: doneList.id,
        position: 0,
        completedAt: new Date()
      }
    ];

    for (const [index, taskData] of tasks.entries()) {
      const task = await prisma.task.create({
        data: {
          ...taskData,
          boardId: testBoard.id,
          createdBy: testUser.id
        }
      });
      console.log(`✓ Created task ${index + 1}:`, task.title);
    }

    console.log('🎉 Database seeded successfully!');
    console.log('\n📝 Test data created:');
    console.log(`- User: ${testUser.email} (ID: ${testUser.id})`);
    console.log(`- Team: ${testTeam.name} (ID: ${testTeam.id})`);
    console.log(`- Client: ${testClient.name}`);
    console.log(`- Board: ${testBoard.name} (ID: ${testBoard.id})`);
    console.log(`- Lists: 3 (To Do, In Progress, Done)`);
    console.log(`- Tasks: ${tasks.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
