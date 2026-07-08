export interface FolderEntry {
  id: string;
  name: string;
  icon: string;
  parentId?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FolderWithId = FolderEntry & { id: string };
