/**
 * mock.ts — Meetings module
 * ───────────────────────
 * Mock data for meetings, notes, and action items.
 */

import type { Meeting, MeetingNote } from '@/modules/meetings/types/meeting';

const sampleAttachment = (n: number) => ({
  name: `file-${n}.pdf`,
  url: '#',
  storagePath: `projects/default/meetings/M-01/attachments/file-${n}.pdf`,
  size: 1024 * 100 * n,
  contentType: 'application/pdf',
  uploadedAt: '01/03/2026',
});

export const upcomingMeetings: Meeting[] = [
  {
    id: "M-01", date: "14/03/2026", day: 14, month: "MAR", year: 2026,
    title: "Sprint Planning S-09",
    time: "09:00",
    description: "Lên kế hoạch sprint tiếp theo, phân công công việc cho team.",
    location: "Google Meet", attendeeIds: ["TM-01", "TM-02", "TM-03", "TM-04"], important: true,
    attachments: [sampleAttachment(1)],
    notes: [
      { id: "MN-01", title: "Sprint Review S-07 — Kết quả và cải tiến", date: "28/02/2026", actionCount: 5, author: "Anh Nguyễn", attachments: [] },
      { id: "MN-02", title: "Architecture Decision — Redis Cache Layer", date: "25/02/2026", actionCount: 3, author: "Bảo Trần", attachments: [] },
    ],
  },
  {
    id: "M-02", date: "15/03/2026", day: 15, month: "MAR", year: 2026,
    title: "Design Review — Checkout UI",
    time: "14:00",
    description: "Review UI flow cho màn hình checkout và thanh toán.",
    location: "Phòng A2", attendeeIds: ["TM-05", "TM-01", "TM-03"], important: false,
    attachments: [],
    notes: [
      { id: "MN-03", title: "UX Research — User Testing Feedback", date: "20/02/2026", actionCount: 4, author: "Ema Vũ", attachments: [] },
    ],
  },
  {
    id: "M-03", date: "17/03/2026", day: 17, month: "MAR", year: 2026,
    title: "Sprint Review & Retrospective S-08",
    time: "15:00",
    description: "",
    location: "Google Meet", attendeeIds: ["TM-01", "TM-02", "TM-06", "TM-07"], important: true,
    attachments: [],
    notes: [],
  },
  {
    id: "M-04", date: "20/03/2026", day: 20, month: "MAR", year: 2026,
    title: "Stakeholder Demo — Alpha Release",
    time: "10:00",
    description: "",
    location: "Phòng Hội đồng", attendeeIds: ["TM-01", "TM-08"], important: true,
    attachments: [],
    notes: [],
  },
];

// Standalone notes list (used elsewhere if needed)
export const meetingNotes: MeetingNote[] = upcomingMeetings.flatMap((m) => m.notes ?? []);
