import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// GET /api/export-data
export async function GET(request: NextRequest) {
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

    // Get all user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedTeams: {
          include: {
            members: true,
            boards: {
              include: {
                lists: {
                  include: {
                    tasks: true
                  }
                },
                tasks: true,
                issues: true
              }
            },
            projects: {
              include: {
                client: true,
                issues: true
              }
            }
          }
        },
        teamMembers: {
          include: {
            team: true
          }
        },
        clientsCreated: true,
        assignedTasks: true,
        createdTasks: true,
        assignedIssues: true,
        createdIssues: true,
        issuedInvoices: {
          include: {
            items: true,
            client: true
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create export data structure
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        displayName: userData.displayName,
        createdAt: userData.createdAt,
      },
      teams: userData.ownedTeams,
      teamMemberships: userData.teamMembers,
      clients: userData.clientsCreated,
      tasks: {
        assigned: userData.assignedTasks,
        created: userData.createdTasks
      },
      issues: {
        assigned: userData.assignedIssues,
        created: userData.createdIssues
      },
      invoices: userData.issuedInvoices,
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0.0'
    };

    // Return as JSON download
    const response = new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nesternity-data-${user.id}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

    return response;
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
