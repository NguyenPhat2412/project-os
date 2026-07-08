export interface BudgetItem {
  id: string;
  category: string;
  icon: string;
  spent: number;
  budget: number;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  approverId?: string; // ref → team_members/{id}
  status: "Paid" | "Pending";
}
