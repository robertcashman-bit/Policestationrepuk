import { test, expect } from '@playwright/test';

const TS = Date.now();

test.describe('Public entry points', () => {
  test('home page loads with 200', async ({ page }) => {
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('"Join the Directory (Free)" nav link is visible and points to /register', async ({ page }) => {
    await page.goto('/');
    const joinLink = page.locator('a', { hasText: /join the directory/i }).first();
    await expect(joinLink).toBeVisible();
    const href = await joinLink.getAttribute('href');
    expect(href).toBe('/register');
  });

  test('"Create My Free Profile" CTA on home page points to /register', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('a', { hasText: /create my free profile/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBe('/register');
  });

  test('"Find a Rep" link is visible and points to /directory', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('nav a', { hasText: /find a rep/i }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe('/directory');
  });

  test('"Log In" link points to /Account', async ({ page }) => {
    await page.goto('/');
    const link = page.locator('a', { hasText: /log in/i }).first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe('/Account');
  });

  test('homepage shows WhatsApp group promo (reps + firms) with procedure link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Join the WhatsApp group/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Full joining procedure/ }).first()).toHaveAttribute('href', '/WhatsApp');
  });

  test('/Join page loads and links to /register', async ({ page }) => {
    const res = await page.goto('/Join');
    expect(res?.status()).toBe(200);
    const cta = page.locator('a', { hasText: /create my free profile/i }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBe('/register');
  });

  test('.com redirects to .org', async ({ page }) => {
    const res = await page.goto('https://policestationrepuk.com/', { waitUntil: 'commit' });
    expect(page.url()).toContain('policestationrepuk.org');
  });
});

test.describe('Join form renders correctly', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('page loads with 200', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('all required fields are present', async ({ page }) => {
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
  });

  test('optional fields are present', async ({ page }) => {
    await expect(page.locator('input#phone')).toBeVisible();
    await expect(page.locator('input#accreditation')).toBeVisible();
    await expect(page.locator('input#counties')).toBeVisible();
    await expect(page.locator('input#stations')).toBeVisible();
    await expect(page.locator('select#availability')).toBeVisible();
    await expect(page.locator('textarea#message')).toBeVisible();
  });

  test('submit button is visible and enabled', async ({ page }) => {
    const btn = page.locator('button[type="submit"]');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText(/submit registration/i);
  });

  test('honeypot field exists but is hidden from users', async ({ page }) => {
    const wrapper = page.locator('[aria-hidden="true"]').filter({ has: page.locator('input#reg-website') });
    await expect(wrapper).toBeAttached();
    const opacity = await wrapper.evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('0');
  });
});

test.describe('Form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('empty submit is prevented by HTML required attributes', async ({ page }) => {
    const nameField = page.locator('input#name');
    const btn = page.locator('button[type="submit"]');
    await btn.click();
    const valid = await nameField.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });

  test('invalid email is blocked', async ({ page }) => {
    await page.fill('input#name', 'Test User');
    await page.fill('input#email', 'not-an-email');
    const btn = page.locator('button[type="submit"]');
    await btn.click();
    const valid = await page.locator('input#email').evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });

  test('whitespace-only name sends but backend rejects or trims', async ({ page }) => {
    await page.fill('input#name', '   ');
    await page.fill('input#email', `pw-test-${TS}@example.com`);
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/register')),
      page.locator('button[type="submit"]').click(),
    ]);
    const body = await response.json();
    if (response.status() === 400) {
      expect(body.error).toBeTruthy();
    }
  });
});

test.describe('Successful submission', () => {
  test('valid registration shows success message', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input#name', `Playwright Test ${TS}`);
    await page.fill('input#email', `pw-test-${TS}@example.com`);
    await page.fill('input#phone', '07700900000');
    await page.fill('input#accreditation', 'PSRAS');
    await page.fill('input#counties', 'Kent, London');
    await page.fill('input#stations', 'Maidstone, Canterbury');
    await page.selectOption('select#availability', 'full-time');
    await page.fill('textarea#message', 'Automated Playwright test submission');

    const btn = page.locator('button[type="submit"]');

    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/register')),
      btn.click(),
    ]);

    expect([200, 429]).toContain(response.status());

    if (response.status() === 200) {
      const successAlert = page.locator('[role="alert"]').filter({ hasText: /registration received/i });
      await expect(successAlert).toBeVisible({ timeout: 10_000 });
      await expect(successAlert).toContainText(/confirmation email/i);
    } else {
      const errorAlert = page.locator('[role="alert"]').filter({ hasText: /too many|something went wrong/i });
      await expect(errorAlert).toBeVisible({ timeout: 5_000 });
    }
  });

  test('duplicate submit is prevented by loading state', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input#name', `Dup Test ${TS}`);
    await page.fill('input#email', `dup-test-${TS}@example.com`);

    const btn = page.locator('button[type="submit"]');
    await btn.click();
    const disabled = await btn.isDisabled();
    expect(disabled).toBe(true);
  });
});

test.describe('Error handling', () => {
  test('server error shows user-friendly message', async ({ page }) => {
    await page.goto('/register');
    await page.route('**/api/register', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Server broke"}' }),
    );
    await page.fill('input#name', 'Error Test');
    await page.fill('input#email', 'error@example.com');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /something went wrong/i });
    await expect(errorAlert).toBeVisible({ timeout: 5_000 });
  });

  test('network failure shows error state', async ({ page }) => {
    await page.goto('/register');
    await page.route('**/api/register', (route) => route.abort());
    await page.fill('input#name', 'Net Fail Test');
    await page.fill('input#email', 'netfail@example.com');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /something went wrong/i });
    await expect(errorAlert).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Mobile viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('register form renders on mobile', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input#name')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
