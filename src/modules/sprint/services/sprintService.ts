/**
 * sprintService.ts — Sprint module
 * ─────────────────────────────────
 * Firestore CRUD for sprints collection.
 * Path: projects/{PROJECT_ID}/sprints
 */

import { sprintsCollection } from '@/modules/sprint/collections/sprint';
import type { Sprint, SprintStatus } from '@/modules/sprint/types/sprint';

type CreateSprintInput = Omit<Sprint, 'id'>;

export const sprintService = {
  async create(data: CreateSprintInput) {
    return sprintsCollection.helpers.create(data as never);
  },

  async update(id: string, data: Partial<Omit<Sprint, 'id'>>) {
    return sprintsCollection.helpers.update(id, data as never);
  },

  async delete(id: string) {
    return sprintsCollection.helpers.delete(id);
  },

  async setStatus(id: string, status: SprintStatus) {
    return sprintsCollection.helpers.update(id, { status } as never);
  },

  async getAll(): Promise<(Sprint & { id: string })[]> {
    return sprintsCollection.helpers.fetchList() as Promise<(Sprint & { id: string })[]>;
  },
};
