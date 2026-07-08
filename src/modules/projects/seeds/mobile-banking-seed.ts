/**
 * mobile-banking-seed.ts
 * Seed tất cả data cho project Mobile Banking App (projectId: 'ebanking')
 * Uses Firebase Client SDK directly.
 */

import { setDoc } from 'firebase/firestore';
import { createProjectCollections } from './seed-utils';
import { mbTeam, mbSprints, mbTasks, mbBugs, mbRisks, mbEpics } from './mobile-banking-mock';

const PROJECT_ID = 'ebanking';

export async function seedMobileBanking(): Promise<void> {
  const { tasks, team, sprints, bugs, risks, epics } = createProjectCollections(PROJECT_ID);

  for (const member of mbTeam) {
    const { id, ...data } = member;
    await setDoc(team.ref(id), data);
  }

  for (const sprint of mbSprints) {
    const { id, ...data } = sprint;
    await setDoc(sprints.ref(id), data);
  }

  for (const task of mbTasks) {
    const { id, ...data } = task;
    await setDoc(tasks.ref(id), data);
  }

  for (const bug of mbBugs) {
    const { id, ...data } = bug;
    await setDoc(bugs.ref(id), data);
  }

  for (const risk of mbRisks) {
    const { id, ...data } = risk;
    await setDoc(risks.ref(id), data);
  }

  for (const epic of mbEpics) {
    const { id, ...data } = epic;
    const itemCount = epic.items.length;
    const storyPoints = epic.items.reduce((sum, item) => sum + (item.points ?? 0), 0);
    await setDoc(epics.ref(id), { ...data, itemCount, storyPoints });
  }
}
