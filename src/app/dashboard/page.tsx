import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardOverview() {
  // In a real app, you would fetch the user's teams and show a team picker or recent team
  // For now, guide user to Teams page to select or create a team
  return (
    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      <Card className="p-6 flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Teams</div>
        <div className="text-3xl font-bold">Manage</div>
        <Link href="/dashboard/teams" className="text-primary hover:underline text-sm mt-2">
          View Teams
        </Link>
      </Card>
      <Card className="p-6 flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Clients</div>
        <div className="text-3xl font-bold">—</div>
        <span className="text-muted-foreground text-xs mt-2">Select a team to view clients</span>
      </Card>
      <Card className="p-6 flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Boards</div>
        <div className="text-3xl font-bold">—</div>
        <span className="text-muted-foreground text-xs mt-2">Select a team to view boards</span>
      </Card>
      <Card className="p-6 flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Settings</div>
        <div className="text-3xl font-bold">—</div>
        <span className="text-muted-foreground text-xs mt-2">Select a team to manage settings</span>
      </Card>
    </div>
  );
}
