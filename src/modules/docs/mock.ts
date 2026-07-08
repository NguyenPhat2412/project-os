/**
 * mock.ts — Docs module
 * ───────────────────────
 * Mock data for documents and wiki links.
 */

import type { DocEntry } from '@/modules/docs/collections/documents';
import type { WikiLink } from '@/modules/docs/collections/wikiLinks';
import type { FolderEntry } from '@/modules/docs/types/folder';

export const folders: FolderEntry[] = [
  { id: 'FOLDER-01', name: 'Sprint Docs', icon: '🏃', parentId: undefined, order: 1, createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-01-15') },
  { id: 'FOLDER-02', name: 'Architecture', icon: '🏗️', parentId: undefined, order: 2, createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-01-15') },
  { id: 'FOLDER-03', name: 'API Specs', icon: '🔌', parentId: 'FOLDER-02', order: 1, createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-01-20') },
  { id: 'FOLDER-04', name: 'Design System', icon: '🎨', parentId: undefined, order: 3, createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-01') },
];

export const documents: DocEntry[] = [
  { id: 'DOC-01', icon: '📋', name: 'SRS — Software Requirements Specification', type: 'PDF', size: '2.4 MB', date: '28/02/2026', badge: { label: 'Approved', variant: 'green' }, folderId: 'FOLDER-01' },
  { id: 'DOC-02', icon: '🎨', name: 'UI/UX Mockups — E-Commerce Platform', type: 'Figma', size: '—', date: '05/03/2026', badge: { label: 'Mới nhất', variant: 'accent' }, folderId: 'FOLDER-04' },
  { id: 'DOC-03', icon: '📐', name: 'Database Schema v2.1', type: 'DBML', size: '48 KB', date: '01/03/2026', badge: { label: 'Updated', variant: 'yellow' }, folderId: 'FOLDER-02' },
  { id: 'DOC-04', icon: '🔌', name: 'API Documentation — REST Endpoints', type: 'OpenAPI', size: '320 KB', date: '10/03/2026', badge: { label: 'Draft', variant: 'muted' }, folderId: 'FOLDER-03' },
  { id: 'DOC-05', icon: '🧪', name: 'Test Plan & Test Cases Sprint 08', type: 'XLSX', size: '890 KB', date: '04/03/2026', badge: { label: 'Active', variant: 'accent' }, folderId: 'FOLDER-01' },
  { id: 'DOC-06', icon: '🚀', name: 'Deployment Runbook v1.3', type: 'MD', size: '65 KB', date: '08/03/2026', badge: { label: 'Approved', variant: 'green' } },
];

export const wikiLinks: WikiLink[] = [
  { id: 'WL-01', title: 'Hướng dẫn setup môi trường dev', icon: '⚙️', summary: 'Cài Node.js, package manager, biến môi trường và script khởi động dự án.' },
  { id: 'WL-02', title: 'Convention code & Git workflow', icon: '📝', summary: 'Quy ước naming, cấu trúc branch, commit message và luồng code review.' },
  { id: 'WL-03', title: 'Checklist deploy production', icon: '✅', summary: 'Danh sách các bước kiểm tra trước/sau khi deploy production.' },
  { id: 'WL-04', title: 'Quy trình báo cáo bug', icon: '🐛', summary: 'Mẫu báo cáo bug, mức độ ưu tiên và vòng đời xử lý lỗi.' },
  { id: 'WL-05', title: 'Glossary thuật ngữ nghiệp vụ', icon: '📖', summary: 'Tổng hợp thuật ngữ BA/QA/Dev dùng chung trong dự án.' },
];
