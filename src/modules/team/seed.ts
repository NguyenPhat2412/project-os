/**
 * seed.ts — Team module
 * ───────────────────────
 * Seed data and functions for team members.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { teamMembers as mockTeamMembers, allMembers } from '@/modules/team/mock';
import type { RootMember } from '@/modules/root/types/root-member';
import type { ProjectTeamMember } from '@/modules/team/types/team';

const TEAM_COL = collection(db, `projects/${PROJECT_ID}/members`);
const MEMBERS_COL = collection(db, 'members');

/**
 * Seed team members — always overwrites to keep data in sync.
 * Writes ProjectTeamMember (memberId, roles) to project subcollection.
 * Doc id = memberId (matches /members/{memberId}).
 */
export async function seedTeamMembers(): Promise<{ created: number }> {
  for (const member of mockTeamMembers) {
    const membership: Omit<ProjectTeamMember, 'id'> = {
      memberId: member.id,
      roles: member.roles,
      notes: '',
    };
    await setDoc(doc(TEAM_COL, member.id), membership);
  }
  console.log(`👥 Seeded ${mockTeamMembers.length} team members`);
  return { created: mockTeamMembers.length };
}

/**
 * Seed global company members registry (members/ via membersCollection).
 * Maps TeamMember mock data (id, name) → RootMember format (uid, displayName).
 */
export async function seedMembers(): Promise<{ created: number }> {
  for (const member of allMembers) {
    const rootMember: Omit<RootMember, 'createdAt' | 'updatedAt'> = {
      uid: member.id,
      email: member.email,
      displayName: member.name,
      roles: member.roles,
    };
    await setDoc(doc(MEMBERS_COL, member.id), rootMember);
  }
  console.log(`👥 Seeded ${allMembers.length} global members`);
  return { created: allMembers.length };
}
