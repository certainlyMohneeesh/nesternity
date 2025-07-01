import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// Get lists for a board
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; boardId: string } }
) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: user.id
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: params.teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify board exists and belongs to team
    const board = await (db as any).board.findFirst({
      where: {
        id: params.boardId,
        teamId: params.teamId
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get lists with task counts
    const lists = await (db as any).boardList.findMany({
      where: {
        boardId: params.boardId,
        archived: false
      },
      include: {
        _count: {
          select: { 
            tasks: {
              where: { archived: false }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error('Get lists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new list
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string; boardId: string } }
) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify user has access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: user.id
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: params.teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify board exists and belongs to team
    const board = await (db as any).board.findFirst({
      where: {
        id: params.boardId,
        teamId: params.teamId
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get the next position for the list
    const lastList = await (db as any).boardList.findFirst({
      where: { boardId: params.boardId },
      orderBy: { position: 'desc' }
    });

    const position = (lastList?.position || 0) + 1;

    // Create the list
    const list = await (db as any).boardList.create({
      data: {
        name,
        boardId: params.boardId,
        position
      },
      include: {
        _count: {
          select: { 
            tasks: {
              where: { archived: false }
            }
          }
        }
      }
    });

    // Create activity log
    await (db as any).boardActivity.create({
      data: {
        boardId: params.boardId,
        userId: user.id,
        action: 'LIST_CREATED',
        details: {
          listName: name
        }
      }
    });

    return NextResponse.json({ list });
  } catch (error) {
    console.error('Create list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
