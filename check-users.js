import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkUsers() {
  console.log('=== Checking Current Database State ===')
  
  // Check users
  const users = await db.user.findMany()
  console.log('Users in database:', users.length)
  users.forEach(user => {
    console.log(`- ${user.id}: ${user.email} (${user.displayName})`)
  })
  
  // Check teams
  const teams = await db.team.findMany({
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  })
  console.log('\nTeams in database:', teams.length)
  teams.forEach(team => {
    console.log(`- ${team.name} (${team.id})`)
    console.log(`  Members: ${team.members.length}`)
    team.members.forEach(member => {
      console.log(`    - ${member.user.email} (${member.role})`)
    })
  })
  
  // Check boards
  const boards = await db.board.findMany({
    include: {
      team: true
    }
  })
  console.log('\nBoards in database:', boards.length)
  boards.forEach(board => {
    console.log(`- ${board.name} (${board.id}) - Team: ${board.team.name}`)
  })
  
  // Check tasks
  const tasks = await db.task.findMany({
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
  console.log('\nTasks in database:', tasks.length)
  tasks.forEach(task => {
    console.log(`- ${task.title} (${task.status}) - ${task.list.board.team.name}/${task.list.board.name}/${task.list.name}`)
  })
  
  await db.$disconnect()
}

checkUsers().catch(console.error)
