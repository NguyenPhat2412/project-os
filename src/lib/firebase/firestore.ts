/**
 * @deprecated Since BFF migration — Firestore client SDK is no longer used.
 * All data operations now go through Next.js API routes via lib/api/client.ts.
 * This file is kept for potential dev tools / emergency use only.
 */
import { getFirestore } from "firebase/firestore";
import { app } from "./config";
export const db = getFirestore(app);
