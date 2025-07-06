import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function ensureTeamOwnersAreMembers() {
  console.log('=== Ensuring Team Owners are Members ===')
  
  try {
    // Find all teams
    const teams = await db.team.findMany({
      include: {
        members: true,
        owner: true
      }
    })
    
    console.log(`Found ${teams.length} teams`)
    
    for (const team of teams) {
      // Check if owner is already a member
      const ownerIsMember = team.members.some(member => member.userId === team.createdBy)
      
      if (!ownerIsMember) {
        console.log(`Adding owner ${team.owner.email} as member of team "${team.name}"`)
        
        // Add owner as member with 'owner' role
        await db.teamMember.create({
          data: {
            teamId: team.id,
            userId: team.createdBy,
            role: 'owner',
            addedBy: team.createdBy,
          }
        })
        
        console.log(`✅ Added owner as member`)
      } else {
        console.log(`✅ Owner ${team.owner.email} is already a member of team "${team.name}"`)
      }
    }
    
    console.log('=== Complete ===')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await db.$disconnect()
  }
}

ensureTeamOwnersAreMembers().catch(console.error)
