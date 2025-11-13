import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { EstimationAssistant } from '@/components/ai/EstimationAssistant';

export default async function EstimatePage() {
  // Auth check
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?returnUrl=/dashboard/ai/estimate');
  }

  // Fetch clients
  const clients = await prisma.client.findMany({
    where: { createdBy: user.id },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      budget: true,
    },
  });

  // Fetch projects from multiple sources and combine them
  const [teamProjects, clientProjects] = await Promise.all([
    // Get projects from user's teams
    prisma.teamMember.findMany({
      where: { userId: user.id },
      select: {
        team: {
          select: {
            projects: {
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    }).then(memberships => 
      memberships.flatMap(m => m.team.projects)
    ),
    
    // Get projects from user's clients
    prisma.project.findMany({
      where: {
        client: {
          createdBy: user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
      },
    }),
  ]);

  // Combine and deduplicate projects
  const projectMap = new Map();
  [...teamProjects, ...clientProjects].forEach(project => {
    projectMap.set(project.id, project);
  });
  const projects = Array.from(projectMap.values()).slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Estimation Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Get accurate project estimates based on your requirements and historical data
        </p>
      </div>

      <EstimationAssistant clients={clients} projects={projects} />
    </div>
  );
}
