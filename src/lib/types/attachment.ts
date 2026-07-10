export interface Attachment {
  name: string;        // original filename (for display)
  url: string;         // authenticated object-storage download URL
  storagePath: string; // full object-storage path (for delete)
  size: number;        // bytes
  contentType: string;
  uploadedAt: string;  // ISO date string
}
