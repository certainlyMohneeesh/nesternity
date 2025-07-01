import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // This is a development-only endpoint
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { email = 'test@example.com', displayName = 'Test User' } = await request.json();
    
    // Create a test user directly in Prisma with a predictable ID
    const testUserId = 'test-user-' + Date.now();
    const uniqueEmail = email.includes('@') ? email.replace('@', `+${Date.now()}@`) : `test+${Date.now()}@example.com`;
    
    const user = await (db as any).user.create({
      data: {
        id: testUserId,
        email: uniqueEmail,
        displayName: displayName,
      }
    });

    // Create a default team for the user
    const defaultTeam = await (db as any).team.create({
      data: {
        name: `${displayName}'s Team`,
        description: 'Your personal workspace',
        createdBy: user.id,
      }
    });

    // Create a default board in the team
    const defaultBoard = await (db as any).board.create({
      data: {
        name: 'Getting Started',
        description: 'Your first board to get started with Nesternity',
        type: 'KANBAN',
        teamId: defaultTeam.id,
        createdBy: user.id,
      }
    });

    // Create default lists in the board
    await (db as any).boardList.createMany({
      data: [
        {
          name: 'To Do',
          boardId: defaultBoard.id,
          position: 1,
          color: '#ef4444',
        },
        {
          name: 'In Progress',
          boardId: defaultBoard.id,
          position: 2,
          color: '#f59e0b',
        },
        {
          name: 'Done',
          boardId: defaultBoard.id,
          position: 3,
          color: '#10b981',
        }
      ]
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName
      },
      team: {
        id: defaultTeam.id,
        name: defaultTeam.name
      },
      board: {
        id: defaultBoard.id,
        name: defaultBoard.name
      }
    });

  } catch (error) {
    console.error('Test user creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
