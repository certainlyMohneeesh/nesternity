import { ProjectList } from "@/components/project/project-list";
import { notFound } from "next/navigation";

interface OrganisationPageProps {
  params: Promise<{
    id: string;
  }>;
}

// This will be server-side fetching - no Prisma import needed here
// The data will be fetched via API in the ProjectList component

export default async function OrganisationPage({ params }: OrganisationPageProps) {
  // Await params in Next.js 15+
  const { id } = await params;
  
  return (
    <div className="space-y-6">
      {/* Projects Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
            <p className="text-muted-foreground">
              Manage and organize your projects
            </p>
          </div>
        </div>
        
        <ProjectList organisationId={id} />
      </div>
    </div>
  );
}

