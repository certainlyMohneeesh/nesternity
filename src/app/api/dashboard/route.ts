import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";

// This endpoint aggregates all dashboard data for the current user in a single call
// Optionally filtered by organisation and/or project
export async function GET(req: NextRequest) {
  try {
    // Extract user/session info from headers
    const userId = req.headers.get("x-user-id");
    
    // Get optional query parameters for filtering
    const { searchParams } = new URL(req.url);
    const organisationId = searchParams.get("organisationId");
    const projectId = searchParams.get("projectId");
    
    console.log('=== DASHBOARD API DEBUG ===');
    console.log('User ID from header:', userId);
    console.log('Organisation ID:', organisationId);
    console.log('Project ID:', projectId);
    console.log('========================');
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const data = await getDashboardData({ 
      userId,
      organisationId: organisationId || undefined,
      projectId: projectId || undefined
    });
    
    console.log('Dashboard data - teams found:', data.teams.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard API - Error:', error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
