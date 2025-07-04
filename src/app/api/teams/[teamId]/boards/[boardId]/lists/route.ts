import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { checkTeamAccess } from '@/lib/team-auth';

// Get lists for a board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; boardId: string }> }
) {
  try {
    const { teamId, boardId } = await params;
    console.log('GET lists - Starting request for team:', teamId, 'board:', boardId);
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('Auth header present:', !!authHeader, 'Token length:', token?.length || 0);
    
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user with token
    let user;
    
    if (token.startsWith('fake-token-') && process.env.NODE_ENV === 'development') {
      // Development mode: extract user ID from fake token
      const userId = token.split('-')[2];
      const dbUser = await db.user.findUnique({
        where: { id: userId }
      });
      
      if (dbUser) {
        user = { id: dbUser.id, email: dbUser.email };
        console.log('Using development auth for user:', user.id);
      } else {
        console.log('Development user not found:', userId);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // Production mode: verify with Supabase
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      console.log('Auth check - User:', !!supabaseUser, 'User ID:', supabaseUser?.id, 'Error:', !!authError);
      
      if (authError || !supabaseUser) {
        console.log('Auth error:', authError?.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      user = supabaseUser;
    }

    // Check team access
    const hasAccess = await checkTeamAccess(teamId, user.id);
    if (!hasAccess) {
      console.log('Access denied for user:', user.id, 'to team:', teamId);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify board exists and belongs to team
    const board = await (db as any).board.findFirst({
      where: {
        id: boardId,
        teamId
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get lists with task counts
    const lists = await (db as any).boardList.findMany({
      where: {
        boardId,
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
  { params }: { params: Promise<{ teamId: string; boardId: string }> }
) {
  try {
    const { teamId, boardId } = await params;
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

    // Check team access
    const hasAccess = await checkTeamAccess(teamId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify board exists and belongs to team
    const board = await (db as any).board.findFirst({
      where: {
        id: boardId,
        teamId
      }
    });

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Get the next position for the list
    const lastList = await (db as any).boardList.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' }
    });

    const position = (lastList?.position || 0) + 1;

    // Create the list
    const list = await (db as any).boardList.create({
      data: {
        name,
        boardId,
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
        boardId,
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
