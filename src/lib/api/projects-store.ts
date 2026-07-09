import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Project } from '@/modules/projects/types/project';

const DEV_PROJECTS_FILE = path.join(process.cwd(), '.next', 'dev-projects.json');

type StoredProject = Project & {
  updatedAt?: string;
};

export function shouldUseDevProjectStore(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    !process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() &&
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  );
}

async function readDevProjects(): Promise<StoredProject[]> {
  try {
    const raw = await readFile(DEV_PROJECTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeDevProjects(projects: StoredProject[]): Promise<void> {
  await mkdir(path.dirname(DEV_PROJECTS_FILE), { recursive: true });
  await writeFile(DEV_PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

export async function listDevProjects(): Promise<StoredProject[]> {
  return readDevProjects();
}

export async function getDevProject(id: string): Promise<StoredProject | null> {
  return (await readDevProjects()).find((project) => project.id === id) ?? null;
}

export async function createDevProject(data: Partial<Project>): Promise<StoredProject> {
  const id = data.id || randomUUID();
  return setDevProject(id, data);
}

export async function setDevProject(id: string, data: Partial<Project>): Promise<StoredProject> {
  const projects = await readDevProjects();
  const index = projects.findIndex((project) => project.id === id);
  const now = new Date().toISOString();
  const next = {
    ...(index >= 0 ? projects[index] : {}),
    ...data,
    id,
    createdAt: (index >= 0 ? projects[index].createdAt : data.createdAt) ?? now,
    updatedAt: now,
  } as StoredProject;

  if (index >= 0) projects[index] = next;
  else projects.push(next);

  await writeDevProjects(projects);
  return next;
}

export async function updateDevProject(id: string, data: Partial<Project>): Promise<StoredProject> {
  const existing = await getDevProject(id);
  if (!existing) throw new Error(`Project ${id} not found`);
  return setDevProject(id, { ...existing, ...data });
}

export async function deleteDevProject(id: string): Promise<void> {
  const projects = await readDevProjects();
  await writeDevProjects(projects.filter((project) => project.id !== id));
}
