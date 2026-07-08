import type { Attachment } from '@/lib/types/attachment';

export interface Meeting {
  id: string;
  date: string; // 'DD/MM/YYYY'
  day: number;
  month: string;
  year: number;
  title: string;
  time: string; // 'HH:mm'
  location: string;
  attendeeIds: string[]; // refs → team_members/{id}
  important?: boolean;
  description?: string;
  attachments: Attachment[];
  notes: MeetingNote[];
}

export interface MeetingNote {
  id: string;
  title: string;
  date: string;
  author: string;
  actionCount: number;
  attachments: Attachment[];
}

export interface MeetingComment {
  id: string;
  author: string;
  avatar: { initials: string; color?: string };
  time: string;
  content: string;
}
