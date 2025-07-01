import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function seed() {
  console.log('=== Seeding Database ===')
  
  // Create a test user - we'll use a Supabase user ID that we can authenticate with
  const testUser = await db.user.create({
    data: {
      id: 'test-user-id', // This should match a real Supabase user ID
      email: 'test@example.com',
      displayName: 'Test User',
    }
  })
  console.log('Created user:', testUser.email)
  
  // Create a test team
  const testTeam = await db.team.create({
    data: {
      name: 'Test Team',
      description: 'A test team for development',
      createdBy: testUser.id,
    }
  })
  console.log('Created team:', testTeam.name)
  
  // Create a test board
  const testBoard = await db.board.create({
    data: {
      name: 'Test Board',
      description: 'A test board for development',
      type: 'KANBAN',
      teamId: testTeam.id,
      createdBy: testUser.id,
    }
  })
  console.log('Created board:', testBoard.name)
  
  // Create some test lists
  const todoList = await db.boardList.create({
    data: {
      name: 'To Do',
      boardId: testBoard.id,
      position: 1,
      color: '#ef4444',
    }
  })
  
  const inProgressList = await db.boardList.create({
    data: {
      name: 'In Progress',
      boardId: testBoard.id,
      position: 2,
      color: '#f59e0b',
    }
  })
  
  const doneList = await db.boardList.create({
    data: {
      name: 'Done',
      boardId: testBoard.id,
      position: 3,
      color: '#10b981',
    }
  })
  
  console.log('Created lists:', todoList.name, inProgressList.name, doneList.name)
  
  console.log('\\n=== Seed Complete ===')
  console.log('Test User ID:', testUser.id)
  console.log('Test Team ID:', testTeam.id)
  console.log('Test Board ID:', testBoard.id)
  
  await db.$disconnect()
}

seed().catch(console.error)
