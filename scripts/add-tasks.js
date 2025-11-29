import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function addTasks() {
  console.log('=== Adding Test Tasks ===')
  
  // Get the existing board and lists
  const board = await db.board.findFirst({
    include: {
      lists: true,
      team: true
    }
  })
  
  if (!board) {
    console.log('No board found, run seed.js first')
    return
  }
  
  console.log('Found board:', board.name)
  console.log('Lists:', board.lists.map(l => l.name))
  
  const todoList = board.lists.find(l => l.name === 'To Do')
  const inProgressList = board.lists.find(l => l.name === 'In Progress')
  const doneList = board.lists.find(l => l.name === 'Done')
  
  if (!todoList || !inProgressList || !doneList) {
    console.log('Lists not found')
    return
  }
  
  const userId = 'test-user-id'
  
  // Create some tasks in To Do
  const task1 = await db.task.create({
    data: {
      title: 'Design new homepage layout',
      description: 'Create wireframes and mockups for the new homepage',
      priority: 'HIGH',
      status: 'TODO',
      dueDate: new Date('2025-01-15'),
      listId: todoList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 1,
    }
  })
  
  const task2 = await db.task.create({
    data: {
      title: 'Setup CI/CD pipeline',
      description: 'Configure automated testing and deployment',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: new Date('2025-01-20'),
      listId: todoList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 2,
    }
  })
  
  // Create some tasks in In Progress
  const task3 = await db.task.create({
    data: {
      title: 'Implement user authentication',
      description: 'Add login/logout functionality with Supabase',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: new Date('2025-01-12'),
      listId: inProgressList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 1,
    }
  })
  
  const task4 = await db.task.create({
    data: {
      title: 'Write API documentation',
      description: 'Document all REST endpoints',
      priority: 'LOW',
      status: 'IN_PROGRESS',
      listId: inProgressList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 2,
    }
  })
  
  // Create some completed tasks
  const task5 = await db.task.create({
    data: {
      title: 'Setup project structure',
      description: 'Initialize Next.js project with TypeScript',
      priority: 'MEDIUM',
      status: 'DONE',
      completedAt: new Date('2025-01-05'),
      listId: doneList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 1,
    }
  })
  
  const task6 = await db.task.create({
    data: {
      title: 'Configure database schema',
      description: 'Setup Prisma with PostgreSQL',
      priority: 'HIGH',
      status: 'DONE',
      completedAt: new Date('2025-01-06'),
      listId: doneList.id,
      boardId: board.id,
      createdBy: userId,
      assignedTo: userId,
      position: 2,
    }
  })
  
  console.log('Created tasks:')
  console.log('- To Do:', task1.title, task2.title)
  console.log('- In Progress:', task3.title, task4.title)
  console.log('- Done:', task5.title, task6.title)
  
  await db.$disconnect()
}

addTasks().catch(console.error)
