import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ teamId: string; boardId: string; listId: string }>
}

// Delete a list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, boardId, listId } = await params;
    
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
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
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // Production mode: verify with Supabase
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !supabaseUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      user = supabaseUser;
    }

    // Verify user has access to the team
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: user.id
      }
    });

    const team = await db.team.findFirst({
      where: {
        id: teamId,
        createdBy: user.id
      }
    });

    if (!teamMember && !team) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify list exists and belongs to board
    const list = await (db as any).boardList.findFirst({
      where: {
        id: listId,
        boardId
      }
    });

    if (!list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    // Check if list has tasks
    const taskCount = await (db as any).task.count({
      where: {
        listId,
        archived: false
      }
    });

    if (taskCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete list with tasks. Please move or delete all tasks first.' 
      }, { status: 400 });
    }

    // Delete the list (soft delete)
    await (db as any).boardList.update({
      where: { id: listId },
      data: { archived: true }
    });

    // Create activity log
    await (db as any).boardActivity.create({
      data: {
        boardId,
        userId: user.id,
        action: 'LIST_DELETED',
        details: {
          listName: list.name
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
