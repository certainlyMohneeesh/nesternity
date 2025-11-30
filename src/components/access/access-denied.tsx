import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
    reason?: string;
    orgId: string;
    projectId: string;
    resourceType?: string; // "proposals", "invoices", "contracts"
}

export function AccessDenied({
    reason,
    orgId,
    projectId,
    resourceType = "this resource"
}: AccessDeniedProps) {
    const title = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            </div>

            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Restricted</AlertTitle>
                <AlertDescription>
                    {reason || "You do not have permission to access this resource."}
                    <br />
                    <br />
                    As a team member, you can access:
                    <ul className="list-disc list-inside mt-2 ml-4">
                        <li>Project boards and tasks</li>
                        <li>Project issues</li>
                        <li>Team collaboration features</li>
                    </ul>
                    <br />
                    For access to {resourceType}, please contact your organisation owner.
                </AlertDescription>
            </Alert>

            <div className="mt-6 flex gap-4">
                <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}`}>
                    <Button variant="outline">
                        Back to Project
                    </Button>
                </Link>
                <Link href={`/dashboard/organisation/${orgId}/projects/${projectId}/teams`}>
                    <Button variant="secondary">
                        View Teams
                    </Button>
                </Link>
            </div>
        </div>
    );
}
