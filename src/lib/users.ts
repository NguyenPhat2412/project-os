import { db, Timestamp } from '@/lib/firestore-admin';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import type { DocumentData } from 'firebase-admin/firestore';
import path from 'path';

const BCRYPT_ROUNDS = 12;
const USERS_COLLECTION = 'users';
const DEV_USERS_FILE = path.join(process.cwd(), '.next', 'dev-users.json');

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

interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

function shouldUseDevUserStore(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    !process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() &&
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()
  );
}

function storedToUser(user: StoredUser): User {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

async function readDevUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readFile(DEV_USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return [];
    throw error;
  }
}

async function writeDevUsers(users: StoredUser[]): Promise<void> {
  await mkdir(path.dirname(DEV_USERS_FILE), { recursive: true });
  await writeFile(DEV_USERS_FILE, JSON.stringify(users, null, 2));
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
  const normalizedEmail = email.toLowerCase();

  if (shouldUseDevUserStore()) {
    const user = (await readDevUsers()).find((item) => item.email === normalizedEmail);
    return user ? storedToUser(user) : null;
  }

  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function getUserById(uid: string): Promise<User | null> {
  if (shouldUseDevUserStore()) {
    const user = (await readDevUsers()).find((item) => item.id === uid);
    return user ? storedToUser(user) : null;
  }

  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;
  return docToUser(doc.id, data);
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const email = input.email.toLowerCase();
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('User with this email already exists');

  if (shouldUseDevUserStore()) {
    // ponytail: single-process dev store; add Firebase env for shared/prod auth.
    const users = await readDevUsers();
    const now = new Date().toISOString();
    const user = {
      id: randomUUID(),
      email,
      name: input.name,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    users.push(user);
    await writeDevUsers(users);
    return storedToUser(user);
  }

  const now = Timestamp.now();
  const docRef = db.collection(USERS_COLLECTION).doc();
  const userData = {
    email,
    name: input.name,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(userData);
  return docToUser(docRef.id, userData);
}

export async function updateUser(uid: string, input: UpdateUserInput): Promise<User> {
  if (shouldUseDevUserStore()) {
    const users = await readDevUsers();
    const index = users.findIndex((item) => item.id === uid);
    if (index === -1) throw new Error(`User ${uid} not found`);

    const updated = { ...users[index], updatedAt: new Date().toISOString() };
    if (input.name !== undefined) updated.name = input.name;
    if (input.email !== undefined) updated.email = input.email.toLowerCase();
    if (input.password !== undefined)
      updated.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    users[index] = updated;
    await writeDevUsers(users);
    return storedToUser(updated);
  }

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
