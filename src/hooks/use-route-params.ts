/**
 * Hook to extract organisation and project IDs from route params
 * Used across all feature pages for data scoping
 */

import { useParams } from 'next/navigation';

export function useOrganisationId(): string {
  const params = useParams();
  return params.id as string;
}

export function useProjectId(): string {
  const params = useParams();
  return params.projectId as string;
}

export function useRouteParams() {
  const params = useParams();
  return {
    organisationId: params.id as string,
    projectId: params.projectId as string,
  };
}
