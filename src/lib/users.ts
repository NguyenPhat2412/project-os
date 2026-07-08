import { db, Timestamp } from '@/lib/firestore-admin';
import bcrypt from 'bcryptjs';
import type { DocumentData } from 'firebase-admin/firestore';

const BCRYPT_ROUNDS = 12;
const USERS_COLLECTION = 'users';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
}

function docToUser(id: string, data: DocumentData): User {
  return {
    id,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function getUserById(uid: string): Promise<User | null> {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return docToUser(doc.id, data);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const existing = await getUserByEmail(input.email);
  if (existing) throw new Error('User with this email already exists');
  const now = Timestamp.now();
  const docRef = db.collection(USERS_COLLECTION).doc();
  const userData = {
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(userData);
  return docToUser(docRef.id, userData);
}

export async function updateUser(uid: string, input: UpdateUserInput): Promise<User> {
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
  if (input.name !== undefined) updates.name = input.name;
  if (input.email !== undefined) updates.email = input.email.toLowerCase();
  if (input.password !== undefined)
    updates.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await db.collection(USERS_COLLECTION).doc(uid).update(updates);
  const updated = await getUserById(uid);
  if (!updated) throw new Error(`User ${uid} not found after update`);
  return updated;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
