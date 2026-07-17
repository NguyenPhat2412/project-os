import { expect, test } from '@playwright/test';

test.describe('Đăng nhập công khai', () => {
  test('hiển thị form email/password và Google OAuth', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Chào mừng trở lại', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tiếp tục với Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  });

  test('chuyển sang form đăng ký không tải lại trang', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Đăng ký ngay' }).click();

    await expect(page.getByRole('button', { name: 'Tạo tài khoản', exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
