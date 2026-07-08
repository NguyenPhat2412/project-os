# Auth Migration: Firebase → NextAuth Credentials

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay Firebase Auth bằng NextAuth Credentials + Firestore. User credentials lưu trong Firestore `users/{uid}`. Firebase SDK (db, storage) giữ lại cho Phase 2.

**Architecture:** NextAuth Credentials provider đọc từ Firestore `users` collection. bcrypt hash password. AuthGuard dùng NextAuth `useSession()` (đã có). Firebase Auth listener trong AuthContext bỏ. Settings pages dùng NextAuth session thay vì Firebase user.

**Tech Stack:** NextAuth v5, Firestore Admin SDK, bcrypt, Zustand (auth-store), React Query

---

## File Map

```
CREATED:
  src/lib/firestore-admin.ts      Firestore Admin instance (server-side)
  src/lib/users.ts               User CRUD + password helpers

UPDATED:
  src/lib/auth.ts                Credentials provider → Firestore lookup
  src/contexts/auth-context.tsx  Bỏ Firebase listener, dùng NextAuth session
  src/app/(auth)/login/page.tsx  signIn credentials thay cho Firebase
  src/app/(auth)/settings/account/page.tsx     Firebase auth → NextAuth + API
  src/app/(auth)/settings/notifications/page.tsx Firebase auth → NextAuth + API
  src/lib/firebase/config.ts     Bỏ auth export, giữ db/storage
  src/store/auth-store.ts        Bỏ Firebase User, giữ profile/roles
  .env                          Bỏ Firebase client vars
  .env.example                  Bỏ Firebase client vars

DELETED:
  src/lib/firebase/auth.ts       Firebase Auth functions
  src/lib/firebase/admin.ts      Firebase Admin verify
  src/app/actions/auth.ts        Firebase token exchange action
```

---

## Dependencies

bcrypt chưa có trong dependencies — cần install trước.

---

## Task 1: Install bcrypt

**Files:** `package.json`

- [ ] **Step 1: Install bcrypt**

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Verify:** `bcryptjs` xuất hiện trong `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add bcryptjs for password hashing"
```

---

## Task 2: Create Firestore Admin instance

**Files:** Create `src/lib/firestore-admin.ts`

- [ ] **Step 1: Tạo file**

```typescript
/**
 * Firestore Admin SDK — server-side only.
 * Import trong API routes và NextAuth config.
 * KHÔNG BAO GIỜ import từ client components.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

let _db: ReturnType<typeof getFirestore> | null = null;

function getDb() {
  if (_db) return _db;

  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  _db = getFirestore();
  return _db;
}

export const db = getDb();
export { Timestamp };
```

**Verify:** File tồn tại tại `src/lib/firestore-admin.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/firestore-admin.ts
git commit -m "feat: add Firestore Admin SDK instance for server-side access"
```

---

## Task 3: Create user CRUD helpers

**Files:** Create `src/lib/users.ts`

- [ ] **Step 1: Tạo file với types + helpers**

```typescript
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
  const snapshot = await db.collection(USERS_COLLECTION).where('email', '==', email.toLowerCase()).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return docToUser(doc.id, doc.data());
}

export async function getUserById(uid: string): Promise<User | null> {
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return docToUser(doc.id, doc.data());
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const now = Timestamp.now();
  const docRef = db.collection(USERS_COLLECTION).doc(); // auto-generate ID
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
  if (input.password !== undefined) updates.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await db.collection(USERS_COLLECTION).doc(uid).update(updates);
  return (await getUserById(uid))!;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
```

**Verify:** `npx tsc --noEmit` không lỗi liên quan đến `src/lib/users.ts`.

- [ ] **Step 2: Commit**

```bash
git add src/lib/users.ts
git commit -m "feat: add user CRUD helpers with bcrypt password hashing"
```

---

## Task 4: Update NextAuth config — Credentials provider

**Files:** `src/lib/auth.ts`

- [ ] **Step 1: Thay thế nội dung file**

```typescript
/**
 * NextAuth v5 configuration với Credentials provider.
 * User credentials đọc từ Firestore `users` collection.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, verifyPassword } from '@/lib/users';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await getUserByEmail(credentials.email as string);
          if (!user) return null;

          const valid = await verifyPassword(user, credentials.password as string);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },

  trustHost: true,
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

**Verify:** `npx tsc --noEmit` không lỗi. Dev server khởi động được.

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "refactor: replace Firebase Auth with NextAuth Credentials provider"
```

---

## Task 5: Update AuthContext — bỏ Firebase listener

**Files:** `src/contexts/auth-context.tsx`

- [ ] **Step 1: Thay thế nội dung file**

```typescript
'use client';
import { useEffect } from 'react';
import { signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { rootMembersCollection } from '@/modules/root/collections/root-members';
import { profileConfig } from '@/lib/project-config';

const logout = async (clearAuth: () => void) => {
  await nextAuthSignOut({ redirect: false });
  clearAuth();
  window.location.assign('/login');
};

// ─── Auth Provider Component ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setRootRoles = useAuthStore((s) => s.setRootRoles);
  const setProfile = useAuthStore((s) => s.setProfile);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) {
      clearAuth();
      return;
    }

    // Load profile and roles from Firestore using the authenticated user ID
    const uid = session.user.id;

    const loadData = async () => {
      try {
        const [member, profile] = await Promise.all([
          rootMembersCollection.helpers.fetch(uid),
          profileConfig.helpers.fetch(uid),
        ]);
        setRootRoles(member?.roles ?? []);
        setProfile(profile ?? null);
      } catch {
        setRootRoles([]);
        setProfile(null);
      }
    };

    loadData();
  }, [session?.user?.id, setRootRoles, setProfile, clearAuth]);

  return <>{children}</>;
}

// ─── useAuth Hook ─────────────────────────────────────────────────────────────

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setRootRoles = useAuthStore((s) => s.setRootRoles);

  const { data: session, status } = useSession();

  // Combine NextAuth session loading with local store loading
  const isLoading = status === 'loading' || loading;

  // Build a user-like object from NextAuth session
  const authUser = session?.user
    ? {
        uid: session.user.id,
        email: session.user.email ?? null,
        displayName: session.user.name ?? null,
        photoURL: session.user.image ?? null,
      }
    : null;

  return {
    user: authUser,
    profile,
    loading: isLoading,
    logout: () => logout(clearAuth),
    refreshProfile: async () => {
      if (session?.user?.id) {
        const profile = await profileConfig.helpers.fetch(session.user.id);
        setProfile(profile ?? null);
      }
    },
  };
}

// ─── Auth Guard ──────────────────────────────────────────────────────────────

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className='flex h-screen items-center justify-center bg-background'>
        <div className='flex flex-col items-center gap-3'>
          <div className='w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin' />
          <span className='text-[13px] text-muted-foreground'>Đang tải…</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return <>{children}</>;
}
```

**Verify:** `npx tsc --noEmit` không lỗi. Dev server khởi động được.

- [ ] **Step 2: Commit**

```bash
git add src/contexts/auth-context.tsx
git commit -m "refactor: remove Firebase Auth listener from AuthContext"
```

---

## Task 6: Update auth-store — bỏ Firebase User type

**Files:** `src/store/auth-store.ts`

- [ ] **Step 1: Thay thế phần types và state**

Thay đổi `user: User | null` (Firebase User) thành:

```typescript
// User type từ NextAuth session (không còn Firebase User)
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  rootRoles: string[];
  projectRoles: Record<string, string[]>;
  loading: boolean;
  hydrated: boolean;
}

export interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setRootRoles: (roles: string[]) => void;
  setProjectRoles: (projectId: string, roles: string[]) => void;
  getAllRoles: () => string[];
  hasRole: (role: string, projectId?: string) => boolean;
  isRootAdmin: () => boolean;
  isAdmin: () => boolean;
  isProjectAdmin: (projectId: string) => boolean;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  clearAuth: () => void;
}
```

Cập nhật `isRootAdmin` để dùng `user.email` thay vì `user?.email`:

```typescript
isRootAdmin: () => {
  const { user, rootRoles } = get();
  return rootRoles.includes(ROOT_ADMIN_ROLE) || user?.email === ADMIN_EMAIL;
},
```

Bỏ `import type { User } from 'firebase/auth'`. Thêm import:

```typescript
import type { UserProfile } from '@/lib/project-config';
```

**Verify:** `npx tsc --noEmit` không lỗi.

- [ ] **Step 2: Commit**

```bash
git add src/store/auth-store.ts
git commit -m "refactor: replace Firebase User type with NextAuth session user"
```

---

## Task 7: Update login page — bỏ Firebase, dùng NextAuth credentials

**Files:** `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Thay thế phần handleEmailSubmit và handleGoogle**

Thay `handleEmailSubmit`:

```typescript
const handleEmailSubmit = async (values: LoginFormValues) => {
    setError('');
    setSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email hoặc mật khẩu không chính xác.');
        return;
      }

      window.location.assign(getSafeCallbackUrl());
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
```

Thay `handleGoogle`:

```typescript
const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      // Google OAuth sẽ được thêm ở Phase 2
      setError('Đăng nhập Google sẽ sớm được hỗ trợ.');
    } catch {
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
```

Thay các import ở đầu file:

```typescript
// XÓA:
// import { signInWithEmailPassword, signInWithGoogle } from '@/lib/firebase/auth';
// import type { FirebaseError } from 'firebase/app';
// import type { User } from 'firebase/auth';

// THÊM:
import { signIn } from 'next-auth/react';
import { useSession } from 'next-auth/react';
```

Loại bỏ biến `const { status, update } = useSession();` (giữ `const { status } = useSession();` thôi).

Loại bỏ `await update()` sau `signIn`.

Loại bỏ biến `let user: User;` và tất cả logic Firebase trong `handleEmailSubmit`.

Loại bỏ `mapFirebaseError` function ở cuối file (không còn Firebase errors).

Loại bỏ Google button hoặc giữ nguyên nhưng disable với message "sắp có".

**Verify:** `npx tsc --noEmit` không lỗi. Dev server khởi động được.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx
git commit -m "refactor: replace Firebase signIn with NextAuth credentials in login page"
```

---

## Task 8: Update account settings — thay Firebase auth bằng API

**Files:** `src/app/(auth)/settings/account/page.tsx`

- [ ] **Step 1: Thay thế Firebase auth imports và logic**

Đọc toàn bộ file, sau đó:

1. **Xóa imports Firebase:**
```typescript
// XÓA:
import { auth } from '@/lib/firebase/config';
import { changePassword, deleteUserAccount, getFirebaseAuthErrorMessage, getUserProfile, saveUserProfile, updateDisplayName, type UserProfile } from '@/lib/firebase/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
```

2. **Thêm imports mới:**
```typescript
// THÊM:
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import type { UserProfile } from '@/lib/project-config';
```

3. **Thay thế Firebase user state bằng NextAuth session:**
```typescript
// XÓA:
const [currentUser, setCurrentUser] = useState<User | null>(null);
// THAY BẰNG:
const { data: session } = useSession();
```

4. **Xóa useEffect `onAuthStateChanged`**, thay bằng:
```typescript
useEffect(() => {
  if (!session?.user) return;

  // Load profile from store / API
  setIsLoading(false);
}, [session?.user]);
```

5. **Thay `auth.currentUser?.uid` bằng `session?.user?.id`** trong tất cả các hàm.

6. **Thay `changePassword` Firebase bằng API call:**
```typescript
const handleChangePassword = async (currentPassword: string, newPassword: string) => {
  const res = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to change password');
  }
};
```

7. **Thay `deleteUserAccount` Firebase bằng API call:**
```typescript
const handleDeleteAccount = async (password: string) => {
  const res = await fetch('/api/users/delete-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? 'Failed to delete account');
  }
  await signOut();
  window.location.assign('/login');
};
```

8. **Thay `saveUserProfile` Firebase bằng API call:**
```typescript
const handleSaveProfile = async (data: { displayName: string; address: string; email: string }) => {
  const res = await fetch('/api/users/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save profile');
};
```

9. **Xóa toàn bộ Firebase error mapping** (`getFirebaseAuthErrorMessage`).

10. **Cập nhật `hasPasswordProvider`** — set luôn `true` vì credentials provider luôn có password:
```typescript
const [hasPasswordProvider, setHasPasswordProvider] = useState(true);
```

11. **Xóa `loadUserProfile` function** dùng `getUserProfile`, thay bằng load từ store hoặc API.

**Verify:** `npx tsc --noEmit` không lỗi. Dev server khởi động được.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/settings/account/page.tsx
git commit -m "refactor: replace Firebase auth with NextAuth session in account settings"
```

---

## Task 9: Update notifications settings — bỏ Firebase auth

**Files:** `src/app/(auth)/settings/notifications/page.tsx`

- [ ] **Step 1: Thay thế Firebase auth imports và logic**

1. **Xóa imports Firebase:**
```typescript
// XÓA:
import { auth } from '@/lib/firebase/config';
import { getFirebaseAuthErrorMessage, getUserNotifications, saveUserNotifications } from '@/lib/firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
```

2. **Thêm imports:**
```typescript
import { useSession } from 'next-auth/react';
```

3. **Xóa `onAuthStateChanged` useEffect**, dùng `useSession`:
```typescript
const { data: session } = useSession();

useEffect(() => {
  if (!session?.user?.id) return;
  // load notifications...
}, [session?.user?.id]);
```

4. **Thay `auth.currentUser?.uid` bằng `session?.user?.id`**.

5. **Xóa `getFirebaseAuthErrorMessage`**.

**Verify:** `npx tsc --noEmit` không lỗi.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(auth\)/settings/notifications/page.tsx
git commit -m "refactor: remove Firebase auth from notifications settings"
```

---

## Task 10: Update Firebase config — bỏ auth exports

**Files:** `src/lib/firebase/config.ts`

- [ ] **Step 1: Thay thế file**

```typescript
/**
 * Firebase Client SDK — Firestore + Storage.
 * Auth KHÔNG còn dùng Firebase — chỉ dùng NextAuth Credentials.
 * KHÔNG import auth từ file này.
 */
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FEASUREMENT_ID,
};

function validateFirebaseEnv(): void {
  const requiredEntries: Array<[string, string | undefined]> = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
  ];

  const missing = requiredEntries.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }
}

validateFirebaseEnv();

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
```

**Verify:** `npx tsc --noEmit` không lỗi. Kiểm tra không còn import `auth` từ file này:
```bash
grep -r "from '@/lib/firebase/config'" src/ --include='*.ts' --include='*.tsx' | grep -v node_modules | grep auth
```
Expected: no results.

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase/config.ts
git commit -m "refactor: remove Firebase Auth from config, keep db and storage"
```

---

## Task 11: Xóa Firebase Auth files

**Files:** `src/lib/firebase/auth.ts`, `src/lib/firebase/admin.ts`, `src/app/actions/auth.ts`

- [ ] **Step 1: Kiểm tra không còn references trước khi xóa**

```bash
grep -r "firebase/auth\|firebase/admin\|@/lib/firebase/auth\|@/lib/firebase/admin" src/ --include='*.ts' --include='*.tsx' | grep -v node_modules
```
Expected: no results. Nếu còn references, quay lại tasks trước fix trước.

- [ ] **Step 2: Xóa các file**

```bash
rm src/lib/firebase/auth.ts
rm src/lib/firebase/admin.ts
rm src/app/actions/auth.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove Firebase Auth files replaced by NextAuth Credentials"
```

---

## Task 12: Update environment variables

**Files:** `.env`, `.env.example`

- [ ] **Step 1: Update .env**

Xóa các dòng Firebase client-side:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

Thêm:
```
AUTH_TRUST_HOST=true
```

- [ ] **Step 2: Update .env.example**

Xóa các dòng Firebase client-side tương tự. Giữ đúng các biến cần thiết.

- [ ] **Step 3: Commit**

```bash
git add .env .env.example
git commit -m "chore: remove Firebase client env vars, add AUTH_TRUST_HOST"
```

---

## Task 13: Tạo seed user để test

**Files:** `src/modules/root/seed.ts` hoặc script riêng

- [ ] **Step 1: Tạo user test trong Firestore**

Chạy script tạo user admin để test login:

```typescript
// Script one-time để tạo user admin test
// Chạy bằng: npx ts-node --esm scripts/create-test-user.ts

import { createUser } from '@/lib/users';

async function main() {
  const user = await createUser({
    email: 'admin@claudecode.ai',
    name: 'Admin User',
    password: '123456789',
  });
  console.log('Created user:', user.id, user.email);
}

main().catch(console.error);
```

Hoặc dùng Firebase console để tạo document trong collection `users/{uid}`:
```
Collection: users
Document ID: (auto or your choice)
Fields:
  email: "admin@claudecode.ai"
  name: "Admin User"
  passwordHash: (bcrypt hash của "123456789", cost 12)
  createdAt: Timestamp.now()
  updatedAt: Timestamp.now()
```

Tạo hash: `node -e "console.log(require('bcryptjs').hashSync('123456789', 12))"`

- [ ] **Step 2: Commit (nếu dùng script)**

```bash
git add scripts/create-test-user.ts
git commit -m "chore: add test user creation script"
```

---

## Task 14: Verify end-to-end

- [ ] **Step 1: Restart dev server**

```bash
# Kill existing dev server
# Restart
npm run dev
```

- [ ] **Step 2: Test login flow**

1. Mở `http://localhost:3000/login`
2. Đăng nhập với `admin@claudecode.ai` / `123456789`
3. Kiểm tra redirect sang `/dashboard` thành công
4. Kiểm tra sidebar hiển thị đúng user
5. Refresh trang — session vẫn giữ (không bị redirect loop)
6. Test logout — chuyển về `/login`

- [ ] **Step 3: Test register flow**

1. Ở login page, click "Đăng ký ngay"
2. Đăng ký user mới
3. Kiểm tra redirect sang dashboard
4. Logout và login lại với user mới

- [ ] **Step 4: Test settings pages**

1. Vào Settings → Account: kiểm tra profile load đúng
2. Vào Settings → Notifications: kiểm tra load đúng

---

## Summary

| Task | Action | Files |
|------|--------|-------|
| 1 | Install bcrypt | package.json |
| 2 | Firestore Admin instance | src/lib/firestore-admin.ts |
| 3 | User CRUD helpers | src/lib/users.ts |
| 4 | NextAuth Credentials | src/lib/auth.ts |
| 5 | AuthContext refactor | src/contexts/auth-context.tsx |
| 6 | Auth store refactor | src/store/auth-store.ts |
| 7 | Login page refactor | src/app/(auth)/login/page.tsx |
| 8 | Account settings refactor | src/app/(auth)/settings/account/page.tsx |
| 9 | Notifications settings refactor | src/app/(auth)/settings/notifications/page.tsx |
| 10 | Firebase config cleanup | src/lib/firebase/config.ts |
| 11 | Delete Firebase auth files | src/lib/firebase/auth.ts, admin.ts, actions/auth.ts |
| 12 | Update .env | .env, .env.example |
| 13 | Create test user | scripts/create-test-user.ts |
| 14 | Verify end-to-end | manual testing |
