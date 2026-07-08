export interface Project {
  id: string;
  name: string;
  icon: string;
  sprint: number;
  quarter: string;
}

export interface StatData {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral";
  color: "accent" | "red" | "green" | "yellow" | "purple";
}
