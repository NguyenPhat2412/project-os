/**
 * hrm-system-seed.ts
 * Seed tất cả data cho project HRM System (projectId: 'hrm')
 * Uses Firebase Client SDK directly.
 */

import { setDoc } from 'firebase/firestore';
import { createProjectCollections } from './seed-utils';
import { hrmTeam, hrmSprints, hrmTasks, hrmBugs, hrmRisks, hrmEpics } from './hrm-system-mock';

const PROJECT_ID = 'hrm';

export async function seedHRMSystem(): Promise<void> {
  const { tasks, team, sprints, bugs, risks, epics } = createProjectCollections(PROJECT_ID);

  for (const member of hrmTeam) {
    const { id, ...data } = member;
    await setDoc(team.ref(id), data);
  }

  for (const sprint of hrmSprints) {
    const { id, ...data } = sprint;
    await setDoc(sprints.ref(id), data);
  }

  for (const task of hrmTasks) {
    const { id, ...data } = task;
    await setDoc(tasks.ref(id), data);
  }

  for (const bug of hrmBugs) {
    const { id, ...data } = bug;
    await setDoc(bugs.ref(id), data);
  }

  for (const risk of hrmRisks) {
    const { id, ...data } = risk;
    await setDoc(risks.ref(id), data);
  }

  for (const epic of hrmEpics) {
    const { id, ...data } = epic;
    const itemCount = epic.items.length;
    const storyPoints = epic.items.reduce((sum, item) => sum + (item.points ?? 0), 0);
    await setDoc(epics.ref(id), { ...data, itemCount, storyPoints });
  }
}
