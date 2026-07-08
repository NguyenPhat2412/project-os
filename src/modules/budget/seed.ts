/**
 * seed.ts — Budget module
 * ───────────────────────
 * Seed data and functions for budget items and expenses.
 * Uses Firebase Client SDK directly.
 */

import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { PROJECT_ID } from '@/lib/project';
import { budgetItems as mockBudgetItems, expenses as mockExpenses } from '@/modules/budget/mock';

const BUDGET_COL = collection(db, `projects/${PROJECT_ID}/budget_items`);
const EXPENSES_COL = collection(db, `projects/${PROJECT_ID}/expenses`);

/**
 * Seed budget items — creates sample items if not exist
 */
export async function seedBudgetItems(): Promise<{ created: number }> {
  const snap = await getDocs(BUDGET_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockBudgetItems.length; i++) {
    const item = mockBudgetItems[i];
    const { id, ...data } = item;
    await setDoc(doc(BUDGET_COL, id), { ...data, order: i });
  }
  console.log(`💰 Seeded ${mockBudgetItems.length} budget items`);
  return { created: mockBudgetItems.length };
}

/**
 * Seed expenses — creates sample expenses if not exist
 */
export async function seedExpenses(): Promise<{ created: number }> {
  const snap = await getDocs(EXPENSES_COL);
  if (snap.size > 0) return { created: 0 };

  for (let i = 0; i < mockExpenses.length; i++) {
    const expense = mockExpenses[i];
    const { id, ...data } = expense;
    await setDoc(doc(EXPENSES_COL, id), { ...data, order: i });
  }
  console.log(`💸 Seeded ${mockExpenses.length} expenses`);
  return { created: mockExpenses.length };
}
