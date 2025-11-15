import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all team IDs for this user
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId: user.id },
      select: { teamId: true },
    });

    const teamIds = teamMembers.map((tm) => tm.teamId);

    if (teamIds.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Get all recent activities from user's teams (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await prisma.activity.findMany({
      where: {
        teamId: { in: teamIds },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { id: true },
    });

    if (activities.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // Upsert notifications for all activities
    const now = new Date();
    const upsertPromises = activities.map((activity) =>
      prisma.notification.upsert({
        where: {
          userId_activityId: {
            userId: user.id,
            activityId: activity.id,
          },
        },
        update: {
          readAt: now,
        },
        create: {
          userId: user.id,
          activityId: activity.id,
          readAt: now,
        },
      })
    );

    await Promise.all(upsertPromises);

    return NextResponse.json({ 
      success: true, 
      count: activities.length 
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
