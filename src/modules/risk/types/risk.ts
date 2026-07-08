export type RiskLevel = "Critical" | "High" | "Medium" | "Low";

export interface Risk {
  id: string;
  level: RiskLevel;
  description: string;
  mitigation: string;
  ownerId: string; // ref → team_members/{id}
  status: string;
  dueDate?: string;
}
