# Auth — Authentication & Authorization

## Overview

ProjectOS dùng **Firebase Authentication** (client-side) kết hợp **NextAuth v5** (server-side sessions) + **Firebase Admin SDK** (token verification).

```
Client                    Next.js Server                Firebase
  │                              │                         │
  │ signInWithPopup/SRP ───────► │                         │
  │                              │ verifyIdToken ────────►│
  │                              │◄── claims ──────────────│
  │◄── NextAuth JWT cookie       │                         │
  │    (httpOnly, secure)        │                         │
```

**Flow:**

1. Client: `signInWithGoogle/Email` → Firebase Auth
2. Client: `user.getIdToken()` → POST `/api/auth/firebase`
3. Server: Firebase Admin `verifyIdToken()` → tạo NextAuth JWT session cookie
4. Middleware: `getToken()` → bảo vệ tất cả routes server-side

---

## Architecture

| Layer              | Technology         | Purpose                               |
| ------------------ | ------------------ | ------------------------------------- |
| Client Auth        | Firebase Auth SDK  | sign-in, token refresh                |
| Session            | NextAuth v5 JWT    | httpOnly cookie, server-side sessions |
| Token Verification | Firebase Admin SDK | server-only ID token verification     |
| Route Protection   | Next.js Middleware | redirects unauthenticated users       |

---

## Files

| File                                                     | Purpose                                              |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `src/lib/firebase/admin.ts`                              | Firebase Admin SDK init (server-only)                |
| `src/lib/auth.ts`                                        | NextAuth v5 config với Credentials provider          |
| `src/app/api/auth/[...nextauth]/route.ts`                | NextAuth handler (GET/POST)                          |
| `src/app/api/auth/firebase/route.ts`                     | Token exchange endpoint                              |
| `src/middleware.ts`                                      | Route protection via `getToken()`                    |
| `src/contexts/auth-context.tsx`                          | Firebase client state (Zustand + onAuthStateChanged) |
| `src/components/providers/nextauth-session-provider.tsx` | NextAuth SessionProvider                             |
| `src/app/layout.tsx`                                     | Root layout với providers                            |

---

## Firebase Auth Methods (`src/lib/firebase/auth.ts`)

```typescript
export const auth: FirebaseAuth;
export const googleProvider: GoogleAuthProvider;
export const githubProvider: GithubAuthProvider;

export function signInWithGoogle(): Promise<UserCredential>;
export function signInWithGithub(): Promise<UserCredential>;
export function signInWithEmail(email: string, password: string): Promise<UserCredential>;
export function createAccount(email: string, password: string): Promise<UserCredential>;
```

---

## Firebase Admin SDK (`src/lib/firebase/admin.ts`)

Server-only. Dùng trong API routes và middleware.

```typescript
export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken>;
export async function revokeUserTokens(uid: string): Promise<void>;
```

---

## Token Exchange (`src/app/api/auth/firebase/route.ts`)

Client gọi sau khi Firebase sign-in thành công:

```typescript
// Login page
const idToken = await user.getIdToken();
await exchangeFirebaseTokenForSession(idToken); // POST /api/auth/firebase

export async function exchangeFirebaseTokenForSession(idToken: string): Promise<void>;
// throws if token invalid or exchange fails
```

---

## useAuth() Hook (`src/contexts/auth-context.tsx`)

```typescript
// Lấy Firebase user + profile
const { user, profile, loading, logout, refreshProfile } = useAuth();

// user: User | null (Firebase User object)
// profile: UserProfile | null (từ Firestore)
// loading: true khi đang khởi tạo auth state
```

### Auth Store (Zustand)

```typescript
// role checking
const { hasRole, isRootAdmin, isAdmin, isProjectAdmin } = useAuthStore();

// example
if (isRootAdmin()) {
  /* ... */
}
if (hasRole('Project Admin', projectId)) {
  /* ... */
}
```

---

## Middleware (`src/middleware.ts`)

Bảo vệ tất cả routes ngoại trừ:

- `/login`
- `/api/auth/*`
- `/_next/*`
- `/favicon.ico`

Unauthenticated users → redirect `/login?callbackUrl=<original path>`.

---

## Firebase Security Rules

Firestore rules đảm bảo **chỉ authenticated users** có thể đọc/ghi:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Anti-Patterns

```typescript
// ❌ KHÔNG dùng Firebase token trực tiếp cho API calls (client-side only)
// Firebase ID tokens cần verify bằng Firebase Admin SDK ở server

// ✅ Dùng NextAuth session cookie (httpOnly, verified server-side)

// ❌ KHÔNG import firebase/admin từ client components
// firebase-admin là server-only, không bao giờ import từ 'use client' files

// ❌ KHÔNG lưu sensitive data vào localStorage
// Firebase Auth state tự quản lý session persistence
```
