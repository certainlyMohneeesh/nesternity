import { PrismaClient } from '@prisma/client'
import { supabase } from '@/lib/supabase'

const db = new PrismaClient()

async function syncSupabaseUser() {
  console.log('=== Syncing Supabase User to Prisma ===')
  
  // Create a test user in Supabase Auth
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'testpassword123',
    email_confirm: true
  })
  
  if (error) {
    console.error('Error creating Supabase user:', error)
    return
  }
  
  console.log('Created Supabase user:', data.user?.id, data.user?.email)
  
  // Now create or update the user in our Prisma database
  if (data.user) {
    try {
      const user = await db.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email || '',
          displayName: 'Test User',
        },
        create: {
          id: data.user.id,
          email: data.user.email || '',
          displayName: 'Test User',
        }
      })
      console.log('Synced user to Prisma:', user.id, user.email)
      
      // Create test team and board for this user
      const testTeam = await db.team.upsert({
        where: { id: 'test-team-id' },
        update: {
          name: 'Test Team',
          description: 'A test team for development',
          createdBy: user.id,
        },
        create: {
          id: 'test-team-id',
          name: 'Test Team',
          description: 'A test team for development',
          createdBy: user.id,
        }
      })
      
      const testBoard = await db.board.upsert({
        where: { id: 'test-board-id' },
        update: {
          name: 'Test Board',
          description: 'A test board for development',
          type: 'KANBAN',
          teamId: testTeam.id,
          createdBy: user.id,
        },
        create: {
          id: 'test-board-id',
          name: 'Test Board',
          description: 'A test board for development',
          type: 'KANBAN',
          teamId: testTeam.id,
          createdBy: user.id,
        }
      })
      
      console.log('Created test team and board')
      console.log('User can now sign in with: test@example.com / testpassword123')
      
    } catch (prismaError) {
      console.error('Error syncing to Prisma:', prismaError)
    }
  }
  
  await db.$disconnect()
}

syncSupabaseUser().catch(console.error)
