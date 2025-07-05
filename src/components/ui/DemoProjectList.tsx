import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Building2 } from 'lucide-react';

export function DemoProjectList({ projects }: { projects: any[] }) {
  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Building2 className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first project</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Projects ({projects.length})</h2>
      </div>
      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {project.description || 'No description'}
                  </CardDescription>
                </div>
                <Badge>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {project.client && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{project.client.name}</span>
                    {project.client.company && (
                      <span className="text-gray-400">({project.client.company})</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{project.team.name}</span>
                </div>
                {(project.startDate || project.endDate) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {project.startDate} - {project.endDate || 'Ongoing'}
                    </span>
                  </div>
                )}
                <div className="flex gap-4 text-sm text-gray-600 pt-2">
                  <span>{project._count?.boards ?? 0} boards</span>
                  <span>{project._count?.issues ?? 0} issues</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
