/**
 * default-seed.ts
 * Seed toàn bộ data cho project E-Commerce Platform (projectId: 'default')
 */

import { seedTaskColumns, seedTasks } from '@/modules/tasks/seed';
import { seedTeamMembers } from '@/modules/team/seed';
import { seedBudgetItems, seedExpenses } from '@/modules/budget/seed';
import { seedRisks } from '@/modules/risk/seed';
import { seedDocuments, seedWikiLinks } from '@/modules/docs/seed';
import { seedMeetings } from '@/modules/meetings/seed';
import { seedActivityFeed, seedNotifications } from '@/modules/activity/seed';
import { seedGanttPhases, seedMilestones } from '@/modules/timeline/seed';
import { seedEpics } from '@/modules/backlog/seed';
import { seedSprints } from '@/modules/sprint/seed';
import { seedBugs, seedBugColumns } from '@/modules/bugs/seed';
import { seedComments } from '@/modules/comments/seed';

export async function seedDefaultProject(): Promise<void> {
  await seedTaskColumns();
  await seedTasks();
  await seedSprints();
  await seedTeamMembers();
  await seedRisks();
  await seedBugColumns();
  await seedBugs();
  await seedBudgetItems();
  await seedExpenses();
  await seedDocuments();
  await seedWikiLinks(); // includes backfillWikiSummary
  await seedMeetings();
  await seedActivityFeed();
  await seedNotifications();
  await seedGanttPhases();
  await seedMilestones();
  await seedEpics();
  await seedComments();
}
