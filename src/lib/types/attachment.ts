export interface Attachment {
  name: string;        // original filename (for display)
  url: string;         // Firebase Storage download URL
  storagePath: string; // full path in Firebase Storage (for delete)
  size: number;        // bytes
  contentType: string;
  uploadedAt: string;  // ISO date string
}
