# Feature Writing Playbook - ProjectOS

ProjectOS starts from real Firestore data only. New modules must not ship static example records, bootstrap records, or hidden fallback datasets.

## Standard Flow

```text
1. Types       -> src/modules/{module}/types/
2. Collection  -> src/modules/{module}/collections/
3. Hook        -> src/modules/{module}/hooks/use{Module}.ts
4. Components  -> src/modules/{module}/components/
5. Page        -> src/app/(dashboard)/{route}/page.tsx
6. Empty state -> clear next action when the collection has no data
7. Permissions -> server-side checks for mutations
8. Metrics     -> derive counts from fetched records
```

## Data Rules

- Read and write through the existing collection/API helpers.
- When Firestore returns no records, render an empty state and accurate zero values.
- Do not hard-code dashboard totals, badges, project lists, people, tasks, bugs, risks, documents, or activity rows.
- Do not create files whose purpose is to prefill product data for development or demos.
- Local-only UI preferences may use localStorage when there is no backend field yet.

## Metrics Rules

- Counts must be calculated from the same records shown in the UI.
- Completion rates must handle an empty denominator and show `0%`.
- Permission-disabled actions must explain the reason briefly.
- Search and filters must work on current client data or show an empty state.

## Checklist

```text
[ ] Collection path uses the current project namespace.
[ ] List UI shows real records only.
[ ] Empty state tells the user what to do next.
[ ] Dashboard/card numbers are derived from fetched data.
[ ] Mutation APIs validate authentication and permission on the server.
[ ] No static example records are imported by runtime code.
[ ] npm run lint passes.
[ ] npm run build passes.
```
