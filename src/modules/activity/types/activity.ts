export interface ActivityEntry {
  id: string;
  avatar: { initials: string; color: string };
  content: string;
  time: string;
  badge?: string;
  badgeVariant?: 'red' | 'green' | 'yellow' | 'accent' | 'purple' | 'muted';
}

export interface Comment {
  id: string;
  author: string;
  avatar: { initials: string; color: string };
  time: string;
  content: string;
}

export interface Notification {
  id: string;
  icon: string;
  content: string;
  time: string;
  unread: boolean;
}
