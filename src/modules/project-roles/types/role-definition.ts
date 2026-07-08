/**
 * Role Definition — defines available RBAC roles per project.
 * Stored in `projects/{projectId}/role_definitions/{slugifiedId}`.
 *
 * Document ID (id) = slugify(name), tách rời khỏi name field để:
 *  - An toàn cho Firestore document ID
 *  - Name có thể thay đổi mà không ảnh hưởng document ID
 */
export interface RoleDefinition {
  /** Firestore document ID — slugify(name) */
  id: string;
  /** Human-readable role name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Badge color variant */
  color: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'purple' | 'orange' | 'rose' | 'cyan';
  createdAt?: Date;
  updatedAt?: Date;
}

/** Default role definitions seeded for new projects */
export const DEFAULT_ROLE_DEFINITIONS: Omit<RoleDefinition, 'createdAt' | 'updatedAt'>[] = [
  { id: 'dev', name: 'Developer', description: 'Lập trình viên', color: 'default' },
  { id: 'qc', name: 'Quality Control', description: 'Chuyên viên kiểm thử', color: 'default' },
  { id: 'pm', name: 'Project Manager', description: 'Quản lý dự án', color: 'secondary' },
  { id: 'ba', name: 'Business Analyst', description: 'Phân tích kinh doanh', color: 'secondary' },
];
