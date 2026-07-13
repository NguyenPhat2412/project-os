# Project OS Frontend

Next.js frontend for Project OS. Authentication, business CRUD, RBAC, reporting,
and file metadata are served through the Spring API Gateway at `/api/v1`.
PostgreSQL is the source of truth and Knowledge service stores file objects in MinIO.

## Local setup

Prerequisites: Node.js 20+, npm, and a healthy Project OS backend Gateway on
`http://127.0.0.1:18080`.

```powershell
Copy-Item .env.example .env.local
npm ci
npm run typecheck
npm run build
npm start
```

Open `http://localhost:3000`. For local development only, use `npm run dev`.
Production and performance checks must use `npm run build` followed by `npm start`.

## Authentication and Google OAuth

Email/password, rotating refresh cookies, CSRF, and Google OAuth are owned by
Identity service. Google credentials belong in the backend secret environment,
not in this repository. Configure these exact local Google redirect values:

```text
Authorized origin:       http://localhost:3000
Authorized redirect URI: http://localhost:3000/api/v1/login/oauth2/code/google
```

## API contracts

With all backend services healthy, regenerate TypeScript OpenAPI contracts using:

```powershell
npm run api:types
```

The browser only calls `/api/v1`; `PROJECT_OS_API_INTERNAL_URL` is used by the
Next.js proxy so backend ports remain bound to loopback. No Firebase, Firestore,
NextAuth, or client-side database SDK is used at runtime.

## Quality gates

```powershell
npm run typecheck
npm run lint
npm run build
```

Before production rollout, also run backend contract/integration tests, the
all-phase runtime smoke suite, backup/restore verification, and browser E2E.
