---
name: 260524-nextauth-firebase
description: Integrate NextAuth v5 with Firebase Auth using Firebase Admin SDK for server-side session verification
metadata:
  type: plan
---

# NextAuth v5 + Firebase Auth Integration

## Status: In Progress

## Overview

Replace client-only Firebase Auth session with NextAuth v5 + Firebase Admin SDK for secure, server-side-verified sessions. All routes protected via middleware.

## Phases

| Phase                  | File                                    | Status |
| ---------------------- | --------------------------------------- | ------ |
| 1. Install             | package.json                            | [ ]    |
| 2. Firebase Admin init | src/lib/firebase/admin.ts               | [ ]    |
| 3. NextAuth config     | src/lib/auth.ts                         | [ ]    |
| 4. NextAuth route      | src/app/api/auth/[...nextauth]/route.ts | [ ]    |
| 5. Token exchange      | src/app/api/auth/firebase/route.ts      | [ ]    |
| 6. Middleware          | src/middleware.ts                       | [ ]    |
| 7. AuthContext bridge  | src/contexts/auth-context.tsx           | [ ]    |
| 8. Login page update   | src/app/(auth)/login/page.tsx           | [ ]    |
| 9. .env.example        | .env.example                            | [ ]    |

## Architecture

```text
Firebase Auth (client SDK)
  → signInWithPopup/SRP
  → getIdToken()
  → POST /api/auth/firebase (exchange)
  → Firebase Admin verifyIdToken (server)
  → NextAuth JWT session cookie (httpOnly, secure)
  → Middleware protects all (dashboard)/* routes
```

## Key Decisions

- **JWT strategy** (not database sessions): Firebase Admin handles stateless token verification
- **No adapter needed**: Firebase is the IdP, NextAuth just wraps the session
- **Bridge pattern**: AuthContext continues using Firebase client SDK, but session is now server-verified
- **Keep existing code**: useAuth(), AuthGuard, Zustand store — all preserved, just bridged to NextAuth

## Files to Create

- src/lib/firebase/admin.ts
- src/lib/auth.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/auth/firebase/route.ts
- src/middleware.ts

## Files to Modify

- src/contexts/auth-context.tsx
- src/app/(auth)/login/page.tsx
- .env.example

## Success Criteria

- [ ] `npm run dev` starts without errors
- [ ] Login with email/password → NextAuth session cookie created
- [ ] Login with Google → NextAuth session cookie created
- [ ] Unauthenticated access to /dashboard → redirected to /login
- [ ] Existing `useAuth()` consumers continue working
- [ ] Logout clears NextAuth session and Firebase session
