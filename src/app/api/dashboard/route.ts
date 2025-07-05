import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard-data";

// This endpoint aggregates all dashboard data for the current user in a single call
export async function GET(req: NextRequest) {
  try {
    // You may want to extract user/session info from cookies or headers here
    // For now, assume userId is available (replace with your auth logic)
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await getDashboardData(userId);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
