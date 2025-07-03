import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/middleware/admin-auth'
import { db } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch real data from database with simplified queries
    const [
      totalUsers,
      totalTeams,
      totalBoards,
      totalTasks,
      totalClients,
      totalInvoices,
      recentUsers,
      recentTeams,
      completedTasks,
      paidInvoices
    ] = await Promise.all([
      // Count total users
      db.user.count(),
      
      // Count total teams
      db.team.count(),
      
      // Count total boards
      db.board.count(),
      
      // Count total tasks
      db.task.count(),
      
      // Count total clients
      db.client.count(),
      
      // Count total invoices
      db.invoice.count(),
      
      // Get recent users (last 10)
      db.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          displayName: true,
          createdAt: true
        }
      }),
      
      // Get recent teams (last 10)
      db.team.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          createdAt: true,
          createdBy: true
        }
      }),
      
      // Count completed tasks
      db.task.count({
        where: { status: 'DONE' }
      }),
      
      // Count paid invoices
      db.invoice.count({
        where: { status: 'PAID' }
      })
    ])

    // Count active users (simplified)
    const activeUsersCount = await db.user.count({
      where: {
        teamMembers: {
          some: {}
        }
      }
    })

    // Get Supabase auth users count
    let supabaseUsersCount = 0
    try {
      const { data } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      })
      supabaseUsersCount = data?.users?.length || 0
    } catch (error) {
      console.warn('Could not fetch Supabase users count:', error)
    }

    // Calculate statistics
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const invoicePaymentRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0

    // Get system statistics
    const stats = {
      users: {
        total: totalUsers,
        active: activeUsersCount,
        supabaseAuth: supabaseUsersCount,
        recent: recentUsers
      },
      teams: {
        total: totalTeams,
        recent: recentTeams
      },
      boards: {
        total: totalBoards
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        completionRate
      },
      clients: {
        total: totalClients
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        paymentRate: invoicePaymentRate
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}