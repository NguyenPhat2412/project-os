import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  FileType2,
  Sheet,
  Presentation,
  ImageIcon,
  Video,
  Archive,
  File,
  Figma,
  Database,
  Code2,
  FileSpreadsheet,
  FileCode2,
} from 'lucide-react';

export interface DocTypeMeta {
  icon: LucideIcon;
  chartColor: string;
  softClass: string;
}

export const DOC_TYPE_META: Record<string, DocTypeMeta> = {
  PDF: {
    icon: FileText,
    chartColor: '#ef4444',
    softClass: 'bg-red-500/10 text-red-600',
  },
  Doc: {
    icon: FileType2,
    chartColor: '#3b82f6',
    softClass: 'bg-blue-500/10 text-blue-600',
  },
  Sheet: {
    icon: Sheet,
    chartColor: '#22c55e',
    softClass: 'bg-green-500/10 text-green-600',
  },
  Slide: {
    icon: Presentation,
    chartColor: '#f97316',
    softClass: 'bg-orange-500/10 text-orange-600',
  },
  Image: {
    icon: ImageIcon,
    chartColor: '#a855f7',
    softClass: 'bg-purple-500/10 text-purple-600',
  },
  Video: {
    icon: Video,
    chartColor: '#ec4899',
    softClass: 'bg-pink-500/10 text-pink-600',
  },
  Archive: {
    icon: Archive,
    chartColor: '#78716c',
    softClass: 'bg-stone-500/10 text-stone-600',
  },
  Figma: {
    icon: Figma,
    chartColor: '#f24e1e',
    softClass: 'bg-orange-500/10 text-orange-500',
  },
  DBML: {
    icon: Database,
    chartColor: '#6366f1',
    softClass: 'bg-indigo-500/10 text-indigo-600',
  },
  OpenAPI: {
    icon: Code2,
    chartColor: '#14b8a6',
    softClass: 'bg-teal-500/10 text-teal-600',
  },
  XLSX: {
    icon: FileSpreadsheet,
    chartColor: '#22c55e',
    softClass: 'bg-green-500/10 text-green-600',
  },
  MD: {
    icon: FileCode2,
    chartColor: '#6b7280',
    softClass: 'bg-gray-500/10 text-gray-600',
  },
  Other: {
    icon: File,
    chartColor: 'oklch(0.600 0.160 240.876)',
    softClass: 'bg-primary/10 text-primary',
  },
};
