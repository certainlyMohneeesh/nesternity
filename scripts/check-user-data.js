import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkUserData() {
  const targetUserId = '4f0178f5-a5e9-4c2e-b3ba-07949ae0d05d' // Your user ID from screenshot
  
  console.log('=== CHECKING USER DATA ===')
  console.log('Target User ID:', targetUserId)
  
  // Check if user exists
  const user = await db.user.findUnique({
    where: { id: targetUserId }
  })
  console.log('\n1. User exists:', !!user)
  if (user) {
    console.log('   Email:', user.email)
    console.log('   Display Name:', user.displayName)
  }
  
  // Check team memberships
  const teamMembers = await db.teamMember.findMany({
    where: { userId: targetUserId },
    include: {
      team: {
        include: {
          boards: true
        }
      }
    }
  })
  console.log('\n2. Team memberships:', teamMembers.length)
  teamMembers.forEach((tm, i) => {
    console.log(`   ${i+1}. Team: ${tm.team.name} (${tm.team.id})`)
    console.log(`      Role: ${tm.role}`)
    console.log(`      Boards: ${tm.team.boards.length}`)
    tm.team.boards.forEach((board, j) => {
      console.log(`        ${j+1}. ${board.name} (${board.id})`)
    })
  })
  
  // Check owned teams
  const ownedTeams = await db.team.findMany({
    where: { createdBy: targetUserId },
    include: {
      boards: true,
      members: true
    }
  })
  console.log('\n3. Owned teams:', ownedTeams.length)
  ownedTeams.forEach((team, i) => {
    console.log(`   ${i+1}. ${team.name} (${team.id})`)
    console.log(`      Members: ${team.members.length}`)
    console.log(`      Boards: ${team.boards.length}`)
  })
  
  // Check tasks
  const tasks = await db.task.findMany({
    where: {
      OR: [
        { createdBy: targetUserId },
        { assignedTo: targetUserId }
      ]
    },
    include: {
      list: {
        include: {
          board: {
            include: {
              team: true
            }
          }
        }
      }
    }
  })
  console.log('\n4. Tasks (created or assigned):', tasks.length)
  tasks.forEach((task, i) => {
    console.log(`   ${i+1}. ${task.title} (${task.status})`)
    console.log(`      Team: ${task.list.board.team.name}`)
    console.log(`      Board: ${task.list.board.name}`)
    console.log(`      List: ${task.list.name}`)
  })
  
  console.log('\n========================')
  
  await db.$disconnect()
}

checkUserData().catch(console.error)
