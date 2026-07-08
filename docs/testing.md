# Testing Strategy

## Trạng thái hiện tại

> ⚠️ **ProjectOS hiện chưa có test suite được implement.** Không có file test nào trong codebase.
>
> Tài liệu này là **kế hoạch testing** — dùng làm reference khi bắt đầu viết tests.
> Khi `tester` agent được gọi mà chưa có test suite, agent cần báo cáo trạng thái này
> và đề xuất bước setup ban đầu thay vì chạy lệnh test (sẽ fail).
>
> **Để setup test suite:** Xem phần "Setup Recommended" bên dưới.

---

## Chiến lược Testing (Recommended)

### Pyramid Testing

``` markdown
         /\
        /E2E\          ← Ít nhất, chậm nhất, tốn nhất
       /------\
      /  Integ  \      ← Vừa phải
     /------------\
    /   Unit Tests  \  ← Nhiều nhất, nhanh nhất, rẻ nhất
   /----------------\
```

### Ưu tiên cho ProjectOS

Do đặc thù FE-Only + Firebase, testing tập trung vào:

1. **Unit tests** cho utility functions và service layer (mock Firebase)
2. **Component tests** cho UI logic quan trọng (form validation, filter logic)
3. **E2E tests** cho critical user flows (login, tạo task, tạo budget item)

---

## Setup Recommended

### Jest + React Testing Library

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Firebase Mocking

```typescript
// __mocks__/firebase/firestore.ts
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));
```

---

## Unit Tests — Utilities

Ưu tiên test các pure functions trong `src/lib/utils.ts`:

```typescript
// src/lib/__tests__/utils.test.ts
import { formatCurrency, formatDate } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats VND correctly', () => {
    expect(formatCurrency(1000000)).toBe('1.000.000 ₫');
  });
});

describe('formatDate', () => {
  it('formats date in Vietnamese locale', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('15/01/2024');
  });
});
```

---

## Unit Tests — Service Layer

Test Firestore operations với mock:

```typescript
// src/modules/tasks/__tests__/taskService.test.ts
import { fetchTasks, createTask } from '../services/taskService';
import { getDocs, addDoc } from 'firebase/firestore';

jest.mock('firebase/firestore');

describe('taskService', () => {
  it('fetchTasks returns mapped Task array', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        { id: 'task-1', data: () => ({ title: 'Test Task', status: 'todo' }) }
      ]
    });

    const tasks = await fetchTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-1');
    expect(tasks[0].title).toBe('Test Task');
  });
});
```

---

## Component Tests

Test hooks và form logic:

```typescript
// src/modules/tasks/__tests__/useTasks.test.tsx
import { renderHook } from '@testing-library/react';
import { useTasks } from '../hooks/useTasks';

// Mock ProjectDataContext
jest.mock('@/context/ProjectDataContext', () => ({
  useProjectData: () => ({
    tasks: mockTasks,
    taskColumns: mockColumns,
    loading: false,
    refresh: jest.fn(),
  }),
}));

describe('useTasks', () => {
  it('filters by priority correctly', () => {
    const { result } = renderHook(() => useTasks({ priority: 'high' }));
    expect(result.current.tasks.every(t => t.priority === 'high')).toBe(true);
  });

  it('filters by search term', () => {
    const { result } = renderHook(() => useTasks({ search: 'Login' }));
    expect(result.current.tasks.every(t =>
      t.title.toLowerCase().includes('login')
    )).toBe(true);
  });
});
```

---

## E2E Tests (Playwright)

Critical flows cần test:

```typescript
// e2e/auth.spec.ts
test('user can login with Google', async ({ page }) => {
  await page.goto('/login');
  // ... Google OAuth flow (cần mock trong test env)
});

// e2e/tasks.spec.ts
test('user can create a new task', async ({ page }) => {
  await page.goto('/tasks');
  await page.getByRole('button', { name: '+ New Task' }).click();
  await page.getByLabel('Title').fill('E2E Test Task');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('E2E Test Task')).toBeVisible();
});
```

---

## Testing với Firebase Emulator

Cho integration tests với Firestore thực:

```bash
# Start emulators
firebase emulators:start --only firestore,auth

# Trong test
import { connectFirestoreEmulator } from 'firebase/firestore';
connectFirestoreEmulator(db, 'localhost', 8080);
```

---

## Scripts (thêm vào package.json khi implement)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## Checklist trước khi thêm tests

Khi viết feature mới và muốn thêm tests:

- [ ] Utility functions → unit test (không cần mock)
- [ ] Service functions → unit test (mock Firebase)
- [ ] Hook filtering logic → renderHook test (mock context)
- [ ] Form validation → test Zod schemas trực tiếp
- [ ] Modal submit flow → component test
- [ ] Critical page flow → E2E test

---

## Coverage Target (khi implement)

| Layer | Target Coverage |
| ----- | -------------- |
| `lib/utils.ts` | 90%+ |
| `lib/types/` | N/A (types only) |
| `modules/*/services/` | 70%+ |
| `modules/*/hooks/` | 60%+ |
| `components/shared/` | 50%+ |
| E2E critical flows | 100% |
