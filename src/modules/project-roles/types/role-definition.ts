/**
 * Role Definition — defines available RBAC roles per project.
 * Stored in `projects/{projectId}/role_definitions/{slugifiedId}`.
 *
 * Document ID (id) = slugify(name), tách rời khỏi name field để:
 *  - An toàn cho API document ID
 *  - Name có thể thay đổi mà không ảnh hưởng document ID
 */
export interface RoleDefinition {
  /** API document ID — slugify(name) */
  id: string;
  /** Human-readable role name */
  name: string;
  /** Human-readable description */
  description: string;
  /** Badge color variant */
  color: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'purple' | 'orange' | 'rose' | 'cyan';
  /** Backend-enforced permissions in resource:action form. */
  permissions?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Default role definitions available for new projects */
export const DEFAULT_ROLE_DEFINITIONS: Omit<RoleDefinition, 'createdAt' | 'updatedAt'>[] = [
  { id: 'project-admin', name: 'Project Admin', description: 'Quản trị dự án', color: 'purple', permissions: ['*:*'] },
  { id: 'dev', name: 'Developer', description: 'Lập trình viên', color: 'default', permissions: ['tasks:*', 'bugs:*', 'comments:*', 'documents:*'] },
  { id: 'qc', name: 'Quality Control', description: 'Chuyên viên kiểm thử', color: 'default', permissions: ['tasks:update', 'bugs:*', 'comments:*'] },
  { id: 'pm', name: 'Project Manager', description: 'Quản lý dự án', color: 'secondary', permissions: ['tasks:*', 'sprints:*', 'epics:*', 'user-stories:*', 'risks:*', 'budget-items:*', 'expenses:*', 'meetings:*', 'milestones:*', 'documents:*'] },
  { id: 'ba', name: 'Business Analyst', description: 'Phân tích kinh doanh', color: 'secondary', permissions: ['epics:*', 'user-stories:*', 'documents:*', 'comments:*'] },
];
