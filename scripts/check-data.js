import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function checkData() {
  console.log('=== Database Check ===')
  
  // Check users
  const users = await db.user.findMany()
  console.log('Users:', users.length)
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.id})`)
  })
  
  // Check teams
  const teams = await db.team.findMany({
    include: {
      members: true,
      owner: true
    }
  })
  console.log('\nTeams:', teams.length)
  teams.forEach(team => {
    console.log(`  - ${team.name} (${team.id})`)
    console.log(`    Owner: ${team.owner.email} (${team.createdBy})`)
    console.log(`    Members: ${team.members.length}`)
    team.members.forEach(member => {
      console.log(`      - User ${member.userId} (role: ${member.role})`)
    })
  })
  
  // Check boards
  const boards = await db.board.findMany()
  console.log('\nBoards:', boards.length)
  boards.forEach(board => {
    console.log(`  - ${board.name} (${board.id}) - Team: ${board.teamId}`)
  })
  
  await db.$disconnect()
}

checkData().catch(console.error)
