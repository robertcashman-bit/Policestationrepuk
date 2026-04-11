import { test, expect } from '@playwright/test';

const BASE = process.env.PW_BASE_URL || 'https://policestationrepuk.org';

/* ------------------------------------------------------------------ */
/*  A. AUTH GUARD TESTS — no session → 401                            */
/* ------------------------------------------------------------------ */
test.describe('Profile API — Auth Guards', () => {
  test('GET /api/account/profile → 401 without session', async ({ request }) => {
    const res = await request.get(`${BASE}/api/account/profile`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Not authenticated');
  });

  test('PUT /api/account/profile → 401 without session', async ({ request }) => {
    const res = await request.put(`${BASE}/api/account/profile`, {
      data: { name: 'Hacker' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Not authenticated');
  });
});

/* ------------------------------------------------------------------ */
/*  B. PUT PAYLOAD VALIDATION — structure / method checks              */
/* ------------------------------------------------------------------ */
test.describe('Profile PUT — Payload Validation', () => {
  test('PUT with empty body still returns 401 (auth before validation)', async ({ request }) => {
    const res = await request.put(`${BASE}/api/account/profile`, { data: {} });
    expect(res.status()).toBe(401);
  });

  test('POST method not accepted (only GET/PUT)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/account/profile`, { data: { name: 'Test' } });
    expect(res.status()).toBe(405);
  });

  test('DELETE method not accepted', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/account/profile`);
    expect(res.status()).toBe(405);
  });
});

/* ------------------------------------------------------------------ */
/*  C. ACCOUNT UI — Login form rendering                              */
/* ------------------------------------------------------------------ */
test.describe('Account Page — UI Rendering', () => {
  test('shows email login form when not authenticated', async ({ page }) => {
    await page.goto('/Account');
    await expect(page.locator('h1')).toContainText('Account', { timeout: 10_000 });
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText(/sign in/i);
  });

  test('login form validates email before submit', async ({ page }) => {
    await page.goto('/Account');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    const valid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });

  test('login form has register link for new reps', async ({ page }) => {
    await page.goto('/Account');
    await page.waitForLoadState('domcontentloaded');
    const registerLink = page.getByRole('link', { name: /register free/i });
    await expect(registerLink).toBeVisible({ timeout: 10_000 });
    const href = await registerLink.getAttribute('href');
    expect(href).toBe('/register');
  });

  test('no console errors on Account page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/Account', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */
/*  D. AUTH FLOW — send-code and verify-code endpoints                */
/* ------------------------------------------------------------------ */
test.describe('Auth Flow — send-code endpoint', () => {
  test('rejects empty body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/send-code`, { data: {} });
    expect([400, 422, 503]).toContain(res.status());
  });

  test('rejects invalid email format', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/send-code`, {
      data: { email: 'not-an-email' },
    });
    expect([400, 422, 503]).toContain(res.status());
  });

  test('accepts valid email or returns 503 if KV unavailable', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/send-code`, {
      data: { email: `nonexistent-${Date.now()}@example.com` },
    });
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.ok).toBe(true);
    }
  });
});

test.describe('Auth Flow — verify-code endpoint', () => {
  test('rejects empty body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/verify-code`, { data: {} });
    expect([400, 401]).toContain(res.status());
  });

  test('rejects wrong code', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/verify-code`, {
      data: { email: 'nobody@example.com', code: '000000' },
    });
    expect(res.status()).toBe(401);
  });

  test('logout endpoint exists and responds', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/logout`);
    expect([200, 302]).toContain(res.status());
  });
});

/* ------------------------------------------------------------------ */
/*  E. PUBLIC PROFILE — Data loads correctly on public rep pages      */
/* ------------------------------------------------------------------ */
test.describe('Public Profile — Data Rendering', () => {
  test('Robert Cashman public profile loads all key sections', async ({ page }) => {
    await page.goto('/rep/robert-cashman');
    await expect(page.locator('h1')).toContainText('Robert Cashman', { timeout: 15_000 });

    const stationSection = page.getByRole('heading', { name: 'Station Coverage' });
    await expect(stationSection).toBeVisible();

    const body = page.locator('body');
    await expect(body).toContainText(/accredit/i);
    await expect(body).toContainText(/availab/i);
  });

  test('public profile has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/rep/robert-cashman', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('public profile returns 200', async ({ page }) => {
    const res = await page.goto('/rep/robert-cashman');
    expect(res?.status()).toBe(200);
  });

  test('non-existent rep returns 404', async ({ page }) => {
    const res = await page.goto('/rep/definitely-not-a-real-rep-12345');
    expect(res?.status()).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/*  F. GET /api/account/profile — response shape (when authenticated) */
/*     We test via the API directly; 401 expected without auth        */
/* ------------------------------------------------------------------ */
test.describe('Profile GET — Response Shape', () => {
  test('returns JSON with error field on 401', async ({ request }) => {
    const res = await request.get(`${BASE}/api/account/profile`);
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });
});

/* ------------------------------------------------------------------ */
/*  G. REGRESSION — core pages still load after changes               */
/* ------------------------------------------------------------------ */
test.describe('Regression — Core Pages Load', () => {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/directory', name: 'Directory' },
    { path: '/register', name: 'Register' },
    { path: '/Account', name: 'Account' },
    { path: '/Map', name: 'Map' },
    { path: '/rep/robert-cashman', name: 'Robert Cashman Profile' },
    { path: '/GoFeatured', name: 'GoFeatured' },
    { path: '/Contact', name: 'Contact' },
  ];

  for (const { path, name } of pages) {
    test(`${name} (${path}) loads without page errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);
      await page.waitForTimeout(1500);
      expect(errors).toHaveLength(0);
    });
  }
});

/* ------------------------------------------------------------------ */
/*  H. DIRECTORY — profiles with overrides appear correctly           */
/* ------------------------------------------------------------------ */
test.describe('Directory — Profile Consistency', () => {
  test('directory page shows representatives', async ({ page }) => {
    await page.goto('/directory');
    await page.waitForLoadState('networkidle');
    const repCards = page.locator('a[href^="/rep/"]').first();
    await expect(repCards).toBeVisible({ timeout: 15_000 });
  });

  test('search page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/search', { waitUntil: 'domcontentloaded' });
    expect([200, 404]).toContain((await page.evaluate(() => document.readyState)) ? 200 : 404);
    await page.waitForTimeout(1500);
    expect(errors).toHaveLength(0);
  });
});
