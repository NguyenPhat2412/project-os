# Auth Migration: Firebase → NextAuth Credentials

**Date:** 2026-05-30
**Status:** Draft
**Author:** Claude

## 1. Mục tiêu

Loại bỏ Firebase Auth, chỉ dùng NextAuth Credentials + Firestore để quản lý user credentials. Phase 1 chỉ thay đổi auth layer. Data layer (Firebase SDK client-side) giữ nguyên.

## 2. Background

### Hiện trạng

- **Auth:** Firebase Auth (client) + NextAuth v5 JWT (session cookie)
- **Data:** Firebase SDK gọi trực tiếp từ client vào Firestore
- **Vấn đề:** Auth flow phức tạp, Firebase Auth gây redirect loop sau login

### Mục tiêu sau thay đổi (Phase 1)

- **Auth:** Chỉ NextAuth Credentials — user lưu trong Firestore (`users/{uid}`)
- **Session:** NextAuth JWT (giữ nguyên)
- **Data layer:** Giữ nguyên Firebase SDK client-side (Phase 2 sẽ chuyển sang API routes)
- **Google OAuth:** Bỏ, chỉ dùng Credentials (email/password)

## 3. Architecture

```
Browser
  │
  ├── Login Form ──POST──► /api/auth/[...nextauth] (NextAuth handler)
  │                              │
  │                              └── verify credentials against Firestore
  │                                     └── users/{uid} (email + hashed password)
  │
  └── Authenticated requests
        ├── Session check ──► AuthGuard ── useSession()
        └── Data access ──► Firebase SDK (client-side, giữ nguyên Phase 1)
```

### Firestore Data Model

**Collection: `users/{uid}`**

```typescript
{
  id: string;           // uid (document ID)
  email: string;         // unique, indexed
  name: string;
  passwordHash: string;  // bcrypt
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Collection: `rootMembers/{uid}`** (existing, keep)

```typescript
{
  uid: string;
  roles: string[];       // e.g. ['root-admin']
  createdAt: Timestamp;
}
```

> Lưu ý: `rootMembers` giữ nguyên — dùng cho phân quyền. `users` là auth layer mới.

## 4. Migration Steps (Phase 1 — Auth Only)

1. **Setup bcrypt** — hash/verify passwords
2. **Create Firestore Admin instance** — server-side Firestore access
3. **Create users CRUD helpers** — getUserByEmail, createUser, updateUser, verifyPassword
4. **Update NextAuth config** — Credentials provider đọc từ Firestore `users` collection
5. **Update AuthContext** — bỏ Firebase listener, dùng NextAuth session
6. **Update login/register page** — bỏ Firebase SDK, dùng credentials provider
7. **Update logout** — bỏ Firebase signOut
8. **Clean up Firebase Auth** — xóa Firebase Auth functions
9. **Update .env** — loại bỏ Firebase client env vars

## 5. Chi tiết từng file

### 5.1 `src/lib/firestore-admin.ts` (NEW)

Firestore Admin instance dùng service account, import trong API routes và NextAuth config.

### 5.2 `src/lib/users.ts` (NEW)

User CRUD helpers:

```typescript
getUserByEmail(email: string): Promise<User | null>
getUserById(uid: string): Promise<User | null>
createUser(data: CreateUserInput): Promise<User>
updateUser(uid: string, data: UpdateUserInput): Promise<User>
verifyPassword(user: User, password: string): Promise<boolean>
hashPassword(password: string): Promise<string>
```

### 5.3 `src/lib/auth.ts` (UPDATE)

- Loại bỏ Firebase Admin verify token
- Credentials provider đọc từ Firestore `users` collection
- Thêm `bcrypt` để hash password

```typescript
// NEW authorize:
async authorize(credentials) {
  const { email, password } = credentials;
  const user = await getUserByEmail(email);
  if (!user) return null;
  const valid = await verifyPassword(user, password);
  if (!valid) return null;
  return { id: user.id, email: user.email, name: user.name };
}
```

### 5.4 `src/contexts/auth-context.tsx` (UPDATE)

- Loại bỏ Firebase `onAuthStateChanged` listener
- Loại bỏ `useAuthListenerStore`
- Giữ `AuthGuard` nhưng đơn giản hóa
- Giữ `useAuth()` hook — gọi `useSession()` từ NextAuth
- Profile/roles load qua `useSession()` + `rootMembersCollection`

### 5.5 `src/app/(auth)/login/page.tsx` (UPDATE)

- Bỏ `signInWithEmailPassword`, `signInWithGoogle` từ Firebase
- Dùng `signIn('credentials', { email, password })` từ NextAuth
- Xóa Google OAuth button (chỉ còn email/password)

### 5.6 `src/lib/firebase/config.ts` (UPDATE)

- Loại bỏ Firebase Auth exports (`auth`, `validateFirebaseEnv`)
- Giữ `db`, `storage` cho Phase 2

### 5.7 `src/lib/firebase/auth.ts` (DELETE)

Xóa toàn bộ Firebase Auth functions.

### 5.8 `src/lib/firebase/admin.ts` (DELETE)

Xóa file. Function `verifyFirebaseToken` không còn cần.

### 5.9 `src/app/actions/auth.ts` (DELETE)

Xóa. Server action cho Firebase token exchange không còn cần.

### 5.10 Environment Variables

```
# XÓA (Firebase client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# GIỮ
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# NextAuth
AUTH_SECRET=
AUTH_TRUST_HOST=true
AUTH_URL=
NEXT_PUBLIC_APP_URL=
```

### 5.11 `.env.example` (UPDATE)

Loại bỏ Firebase client vars, giữ Firebase Admin + NextAuth vars.

## 6. Security Considerations

- **Password hashing:** bcrypt với cost factor 12
- **Auth protection:** `AuthGuard` dùng NextAuth `useSession()` — đã bảo mật
- **Input validation:** Zod validation trên cả client và server

## 7. Rollback Plan

- Git branch `feat/auth-migration-nextauth`
- Nếu cần rollback: `git checkout main`

## 8. Out of Scope

- Phase 2: Chuyển module data access sang API routes
- Thêm OAuth providers (Google, GitHub)
- Thêm password reset / forgot password
- Thêm email verification
- Thay Firestore bằng PostgreSQL

## 9. Files to Create

| File | Purpose |
|------|---------|
| `src/lib/firestore-admin.ts` | Firestore Admin instance (server-side) |
| `src/lib/users.ts` | User CRUD + password hashing |

## 10. Files to Update

| File | Changes |
|------|---------|
| `src/lib/auth.ts` | Replace Firebase Admin verify with Firestore users lookup |
| `src/contexts/auth-context.tsx` | Remove Firebase listener, simplify to NextAuth session |
| `src/app/(auth)/login/page.tsx` | Replace Firebase signIn with NextAuth credentials |
| `src/lib/firebase/config.ts` | Remove auth exports, keep db/storage for Phase 2 |
| `.env` | Remove Firebase client vars |
| `.env.example` | Remove Firebase client vars |

## 11. Files to Delete

| File | Reason |
|------|--------|
| `src/lib/firebase/auth.ts` | Firebase Auth functions replaced |
| `src/lib/firebase/admin.ts` | Firebase Admin verify replaced |
| `src/app/actions/auth.ts` | Server action for Firebase token exchange (no longer needed) |
