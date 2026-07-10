import { platformApi } from '@/lib/platform-api/client';
import type { Project } from '@/modules/projects/types/project';

export type ProjectWrite = Omit<Project, 'id' | 'legacyId' | 'ownerId' | 'createdAt' | 'updatedAt'>;

export function listProjects() {
  return platformApi.getPage<Project>('/projects?page=0&size=100');
}

export function getProject(id: string) {
  return platformApi.getData<Project>(`/projects/${encodeURIComponent(id)}`);
}

export function createProject(project: ProjectWrite) {
  return platformApi.postData<Project>('/projects', project);
}

export function updateProject(id: string, project: Partial<ProjectWrite>) {
  return platformApi.patchData<Project>(`/projects/${encodeURIComponent(id)}`, project);
}

export function deleteProject(id: string) {
  return platformApi.delete(`/projects/${encodeURIComponent(id)}`);
}
