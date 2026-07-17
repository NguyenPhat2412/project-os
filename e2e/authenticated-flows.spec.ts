import { expect, test } from '@playwright/test';

const required = ['E2E_EMAIL', 'E2E_PASSWORD', 'E2E_ORGANIZATION_ID', 'E2E_ORGANIZATION_NAME', 'E2E_PROJECT_ID', 'E2E_PROJECT_NAME'];
const missing = required.filter((key) => !process.env[key]);
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000';
const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(baseURL);
const canRun = missing.length === 0 && (isLocal || process.env.E2E_ALLOW_REMOTE === 'true');
const canMutate = canRun && process.env.E2E_ALLOW_MUTATIONS === 'true';

test.describe.serial('Luồng đã đăng nhập', () => {
  test.skip(!canRun, `Cần ${missing.join(', ') || 'E2E_ALLOW_REMOTE=true cho URL không phải localhost'}`);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(process.env.E2E_EMAIL!);
    await page.getByLabel('Mật khẩu').fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await page.waitForURL(/\/(dashboard|projects|tasks|organization)/, { timeout: 20_000 });
  });

  test('đổi tổ chức và dự án cập nhật URL ngay', async ({ page }) => {
    await page.goto(`/dashboard?organizationId=${process.env.E2E_ORGANIZATION_ID}&projectId=${process.env.E2E_PROJECT_ID}`);

    await page.getByRole('button', { name: 'Chọn tổ chức' }).click();
    await page.getByRole('menuitem', { name: new RegExp(process.env.E2E_ORGANIZATION_NAME!, 'i') }).click();
    await expect(page).toHaveURL(new RegExp(`organizationId=${process.env.E2E_ORGANIZATION_ID}`));

    await page.getByRole('button', { name: 'Chọn dự án' }).click();
    await page.getByRole('menuitem', { name: new RegExp(process.env.E2E_PROJECT_NAME!, 'i') }).click();
    await expect(page).toHaveURL(new RegExp(`projectId=${process.env.E2E_PROJECT_ID}`));
  });

  test('hiển thị danh sách thành viên và bảng chấm công theo workspace', async ({ page }) => {
    await page.goto(`/team?organizationId=${process.env.E2E_ORGANIZATION_ID}&projectId=${process.env.E2E_PROJECT_ID}`);
    await expect(page.getByRole('button', { name: /Thêm thành viên/i })).toBeVisible();

    await page.goto(`/attendance?organizationId=${process.env.E2E_ORGANIZATION_ID}`);
    await expect(page.getByRole('heading', { name: 'Chấm công' })).toBeVisible();
  });

  test('thêm thành viên vào dự án chỉ khi bật mutation', async ({ page }) => {
    test.skip(!canMutate || !process.env.E2E_MEMBER_EMAIL, 'Đặt E2E_ALLOW_MUTATIONS=true và E2E_MEMBER_EMAIL để chạy thêm thành viên.');

    await page.goto(`/team?organizationId=${process.env.E2E_ORGANIZATION_ID}&projectId=${process.env.E2E_PROJECT_ID}`);
    await page.getByRole('button', { name: /Thêm thành viên/i }).click();
    await page.getByPlaceholder('Tìm theo tên, email...').fill(process.env.E2E_MEMBER_EMAIL!);
    const candidate = page.getByText(process.env.E2E_MEMBER_EMAIL!, { exact: true });
    test.skip((await candidate.count()) === 0, 'Tài khoản E2E_MEMBER_EMAIL đã là thành viên hoặc không tồn tại.');
    await candidate.click();
    await page.getByRole('button', { name: 'Thêm vào dự án', exact: true }).click();
    await expect(page.getByText(process.env.E2E_MEMBER_EMAIL!, { exact: true })).toBeVisible();
  });

  test('cho phép kiểm thử tạo/chuyển Kanban/kéo-thả task chỉ khi bật mutation', async ({ page }) => {
    test.skip(!canMutate || !process.env.E2E_TARGET_TASK_STATUS, 'Đặt E2E_ALLOW_MUTATIONS=true và E2E_TARGET_TASK_STATUS để chạy CRUD/kéo-thả task.');
    const title = `E2E task ${Date.now()}`;

    await page.goto(`/tasks?organizationId=${process.env.E2E_ORGANIZATION_ID}&projectId=${process.env.E2E_PROJECT_ID}`);
    await page.getByRole('button', { name: /Tạo mới|Tạo Task/i }).first().click();
    await page.getByLabel(/Tiêu đề/i).fill(title);
    await page.getByRole('button', { name: 'Tạo Task', exact: true }).click();
    await expect(page.getByText(title, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Kanban', exact: true }).click();
    const card = page.locator('[draggable="true"]').filter({ hasText: title });
    await expect(card).toBeVisible();
    await card.dragTo(page.getByTestId(`kanban-column-${process.env.E2E_TARGET_TASK_STATUS}`));
    await expect(card).toBeVisible();
  });
});
