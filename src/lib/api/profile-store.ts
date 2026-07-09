import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { UserProfile } from '@/lib/project-config';

const DEV_PROFILES_FILE = path.join(process.cwd(), '.next', 'dev-profiles.json');

export function shouldUseDevProfileStore(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    !process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() &&
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  );
}

async function readDevProfiles(): Promise<Record<string, UserProfile>> {
  try {
    const raw = await readFile(DEV_PROFILES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return {};
    throw error;
  }
}

async function writeDevProfiles(profiles: Record<string, UserProfile>): Promise<void> {
  await mkdir(path.dirname(DEV_PROFILES_FILE), { recursive: true });
  await writeFile(DEV_PROFILES_FILE, JSON.stringify(profiles, null, 2));
}

export async function getDevProfile(uid: string): Promise<UserProfile | null> {
  return (await readDevProfiles())[uid] ?? null;
}

export async function setDevProfile(uid: string, profile: UserProfile): Promise<UserProfile> {
  const profiles = await readDevProfiles();
  const next = { ...profiles[uid], ...profile, uid };
  profiles[uid] = next;
  await writeDevProfiles(profiles);
  return next;
}
