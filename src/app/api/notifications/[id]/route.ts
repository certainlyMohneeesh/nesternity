import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activityId = params.id;

    // Upsert notification to mark it as read
    const notification = await prisma.notification.upsert({
      where: {
        userId_activityId: {
          userId: user.id,
          activityId: activityId,
        },
      },
      update: {
        readAt: new Date(),
      },
      create: {
        userId: user.id,
        activityId: activityId,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activityId = params.id;

    // Delete notification record (removes from list entirely)
    await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        activityId: activityId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
