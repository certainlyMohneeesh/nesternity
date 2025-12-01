"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDown, Check, Building2, FolderKanban, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSessionToken } from '@/lib/supabase/client-session';
import Image from 'next/image';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  current?: boolean;
  isOrganisation?: boolean;
  isProject?: boolean;
}

interface Organisation {
  id: string;
  name: string;
  type: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
}

export function BreadcrumbCombobox() {
  const pathname = usePathname();
  const router = useRouter();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [projects, setProjects] = useState<Record<string, Project[]>>({});
  const [teams, setTeams] = useState<Record<string, { id: string; name: string }[]>>({});
  const [boards, setBoards] = useState<Record<string, { id: string; name: string }[]>>({});
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Fetch organisations
  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const token = await getSessionToken();
        if (!token) {
          console.log('[BreadcrumbCombobox] No session token available');
          return;
        }

        const response = await fetch('/api/organisations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('[BreadcrumbCombobox] Failed to fetch organisations:', response.status);
          return;
        }

        const data = await response.json();
        setOrganisations(data.organisations || []);
      } catch (err) {
        console.error('[BreadcrumbCombobox] Error fetching organisations:', err);
      }
    };

    fetchOrganisations();
  }, []);

  // Fetch projects for current organisation
  useEffect(() => {
    const fetchProjects = async (orgId: string) => {
      if (!orgId || projects[orgId]) return;

      try {
        const token = await getSessionToken();
        if (!token) return;

        const response = await fetch(`/api/organisations/${orgId}/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        setProjects(prev => ({
          ...prev,
          [orgId]: data.projects || []
        }));
      } catch (err) {
        console.error('[BreadcrumbCombobox] Error fetching projects:', err);
      }
    };

    const pathSegments = pathname.split('/').filter(Boolean);
    const orgIndex = pathSegments.indexOf('organisation');
    if (orgIndex !== -1 && pathSegments[orgIndex + 1]) {
      const orgId = pathSegments[orgIndex + 1];
      fetchProjects(orgId);
    }
  }, [pathname, projects]);

  // Fetch teams for current project
  useEffect(() => {
    const fetchTeams = async (projectId: string) => {
      if (!projectId || teams[projectId]) return;

      try {
        const token = await getSessionToken();
        if (!token) return;

        const response = await fetch(`/api/teams?projectId=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        setTeams(prev => ({
          ...prev,
          [projectId]: data.teams || []
        }));
      } catch (err) {
        console.error('[BreadcrumbCombobox] Error fetching teams:', err);
      }
    };

    const pathSegments = pathname.split('/').filter(Boolean);
    const projectsIndex = pathSegments.indexOf('projects');
    if (projectsIndex !== -1 && pathSegments[projectsIndex + 1]) {
      const projectId = pathSegments[projectsIndex + 1];
      fetchTeams(projectId);
    }
  }, [pathname, teams]);

  // Fetch boards for current team
  useEffect(() => {
    const fetchBoards = async (teamId: string) => {
      if (!teamId || boards[teamId]) return;

      try {
        const token = await getSessionToken();
        if (!token) return;

        const response = await fetch(`/api/teams/${teamId}/boards`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) return;

        const data = await response.json();
        setBoards(prev => ({
          ...prev,
          [teamId]: data.boards || []
        }));
      } catch (err) {
        console.error('[BreadcrumbCombobox] Error fetching boards:', err);
      }
    };

    const pathSegments = pathname.split('/').filter(Boolean);
    const teamsIndex = pathSegments.indexOf('teams');
    if (teamsIndex !== -1 && pathSegments[teamsIndex + 1]) {
      const teamId = pathSegments[teamsIndex + 1];
      fetchBoards(teamId);
    }
  }, [pathname, boards]);

  // Parse pathname to get breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [];

  // Extract organisation ID and project ID from path
  const pathSegments = pathname.split('/').filter(Boolean);
  const orgIndex = pathSegments.indexOf('organisation');
  const projectsIndex = pathSegments.indexOf('projects');

  let currentOrgId = '';
  let currentProjectId = '';

  if (orgIndex !== -1 && pathSegments[orgIndex + 1]) {
    currentOrgId = pathSegments[orgIndex + 1];
  }

  if (projectsIndex !== -1 && pathSegments[projectsIndex + 1]) {
    currentProjectId = pathSegments[projectsIndex + 1];
  }

  // Set selected org
  useEffect(() => {
    if (currentOrgId) {
      setSelectedOrgId(currentOrgId);
    }
  }, [currentOrgId]);

  // Set selected project
  useEffect(() => {
    if (currentProjectId) {
      setSelectedProjectId(currentProjectId);
    }
  }, [currentProjectId]);

  // Dashboard
  breadcrumbItems.push({
    label: 'Home',
    href: '/dashboard',
    icon: <Home className="w-4 h-4" />
  });

  // Organisation level
  if (currentOrgId) {
    const org = organisations.find(o => o.id === currentOrgId);
    breadcrumbItems.push({
      label: org?.name || 'Organisation',
      href: `/dashboard/organisation/${currentOrgId}`,
      icon: <Building2 className="w-4 h-4" />,
      isOrganisation: true // Mark this as the organisation breadcrumb
    });
  }

  // Project level
  if (currentProjectId) {
    const orgProjects = projects[currentOrgId] || [];
    const project = orgProjects.find(p => p.id === currentProjectId);

    breadcrumbItems.push({
      label: project?.name || 'Project',
      href: `/dashboard/organisation/${currentOrgId}/projects/${currentProjectId}`,
      icon: <FolderKanban className="w-4 h-4" />,
      isProject: true // Mark this as the project breadcrumb
    });

    // Sub-pages (teams, boards, etc.)
    const teamsIndex = pathSegments.indexOf('teams');
    const boardsIndex = pathSegments.indexOf('boards');

    if (teamsIndex !== -1 && pathSegments[teamsIndex + 1]) {
      // This is a specific team page
      const teamId = pathSegments[teamsIndex + 1];
      breadcrumbItems.push({
        label: 'Teams',
        href: `/dashboard/organisation/${currentOrgId}/projects/${currentProjectId}/teams`,
      });

      // If there's a team ID, fetch and display team name
      if (!pathSegments[teamsIndex + 2]) {
        // We're on the team overview page
        const projectTeams = teams[currentProjectId] || [];
        const team = projectTeams.find(t => t.id === teamId);
        breadcrumbItems.push({
          label: team?.name || teamId, // Show team name if available, otherwise ID
          href: pathname,
          current: true
        });
      } else if (pathSegments[teamsIndex + 2] === 'boards' && pathSegments[teamsIndex + 3]) {
        // We're on a board page
        const projectTeams = teams[currentProjectId] || [];
        const team = projectTeams.find(t => t.id === teamId);
        breadcrumbItems.push({
          label: team?.name || teamId,
          href: `/dashboard/organisation/${currentOrgId}/projects/${currentProjectId}/teams/${teamId}`,
        });
        breadcrumbItems.push({
          label: 'Boards',
          href: `/dashboard/organisation/${currentOrgId}/projects/${currentProjectId}/teams/${teamId}/boards`,
        });

        const boardId = pathSegments[teamsIndex + 3];
        const teamBoards = boards[teamId] || [];
        const board = teamBoards.find(b => b.id === boardId);
        breadcrumbItems.push({
          label: board?.name || boardId, // Show board name if available, otherwise ID
          href: pathname,
          current: true
        });
      }
    } else {
      // Regular sub-pages
      const subPage = pathSegments[pathSegments.length - 1];
      if (subPage !== currentProjectId && !['projects'].includes(subPage)) {
        breadcrumbItems.push({
          label: subPage.charAt(0).toUpperCase() + subPage.slice(1),
          href: pathname,
          current: true
        });
      }
    }
  }

  const handleOrgSwitch = (orgId: string) => {
    setSelectedOrgId(orgId);
    setOrgPopoverOpen(false);
    router.push(`/dashboard/organisation/${orgId}`);
  };

  const handleProjectSwitch = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectPopoverOpen(false);
    router.push(`/dashboard/organisation/${currentOrgId}/projects/${projectId}`);
  };

  const selectedOrg = organisations.find(o => o.id === selectedOrgId);

  return (
    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm overflow-x-auto">
      {/* Nesternity Logo */}
      <button
        onClick={() => router.push('/')}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label="Go to homepage"
      >
        <Image
          src="/nesternity_l.png"
          alt="Nesternity"
          width={32}
          height={32}
          className="w-6 h-6 sm:w-8 sm:h-8"
        />
      </button>
      <span className="text-muted-foreground">/</span>

        {breadcrumbItems.map((item, index) => (
          <div key={item.href} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {index > 0 && <span className="text-muted-foreground">/</span>}

            {/* Organisation breadcrumb with combobox */}
            {item.isOrganisation && currentOrgId ? (
              <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={orgPopoverOpen}
                    className="justify-between px-1 sm:px-2 h-7 sm:h-8 hover:bg-accent"
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="hidden sm:inline">{item.icon}</span>
                      <span className={cn(
                        "font-medium truncate max-w-[80px] sm:max-w-none",
                        item.current ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search organisations..." />
                    <CommandEmpty>No organisation found.</CommandEmpty>
                    <CommandGroup heading="Your Organisations">
                      {organisations
                        .filter(org => org.type === 'OWNER')
                        .map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.id}
                            onSelect={() => handleOrgSwitch(org.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4" />
                            {org.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandGroup heading="Client Organisations">
                      {organisations
                        .filter(org => org.type === 'CLIENT')
                        .map((org) => (
                          <CommandItem
                            key={org.id}
                            value={org.id}
                            onSelect={() => handleOrgSwitch(org.id)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedOrgId === org.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <Building2 className="mr-2 h-4 w-4" />
                            {org.name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : item.isProject && currentProjectId ? (
              <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={projectPopoverOpen}
                    className="justify-between px-1 sm:px-2 h-7 sm:h-8 hover:bg-accent"
                  >
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="hidden sm:inline">{item.icon}</span>
                      <span className={cn(
                        "font-medium truncate max-w-[80px] sm:max-w-none",
                        item.current ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </div>
                    <ChevronDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No project found.</CommandEmpty>
                    <CommandGroup heading="Projects">
                      {(projects[currentOrgId] || []).map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.id}
                          onSelect={() => handleProjectSwitch(project.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <FolderKanban className="mr-2 h-4 w-4" />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="ghost"
                onClick={() => router.push(item.href)}
                className="justify-start px-1 sm:px-2 h-7 sm:h-8 hover:bg-gray-100"
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="hidden sm:inline">{item.icon}</span>
                  <span className={cn(
                    "font-medium truncate max-w-[80px] sm:max-w-none",
                    item.current ? "text-gray-900" : "text-gray-600"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Button>
            )}
          </div>
        ))}
    </div>
  );
}
