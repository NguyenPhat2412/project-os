/**
 * Firestore Admin SDK — server-side only.
 * Import trong API routes và NextAuth config.
 * KHÔNG BAO GIỜ import từ client components.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';

let _db: Firestore | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Firebase Admin SDK`);
  }
  return value;
}

function normalizePrivateKey(rawPrivateKey: string): string {
  let privateKey = rawPrivateKey.trim();

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  return privateKey.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

function getFirebaseAdminCredential() {
  const projectId = getRequiredEnv('FIREBASE_ADMIN_PROJECT_ID');
  const clientEmail = getRequiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
  const privateKey = normalizePrivateKey(getRequiredEnv('FIREBASE_ADMIN_PRIVATE_KEY'));

  if (
    privateKey.includes('...') ||
    !privateKey.includes('-----BEGIN PRIVATE KEY-----') ||
    !privateKey.includes('-----END PRIVATE KEY-----')
  ) {
    throw new Error(
      'FIREBASE_ADMIN_PRIVATE_KEY must be the real private_key from a Firebase service account JSON file',
    );
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  });
}

export function getDb(): Firestore {
  if (_db) return _db;

  if (getApps().length === 0) {
    initializeApp({
      credential: getFirebaseAdminCredential(),
    });
  }
  _db = getFirestore();
  return _db;
}

export const db = new Proxy({} as Firestore, {
  get(_target, property) {
    const firestore = getDb();
    const value = Reflect.get(firestore, property, firestore);
    return typeof value === 'function' ? value.bind(firestore) : value;
  },
});
export { Timestamp };
