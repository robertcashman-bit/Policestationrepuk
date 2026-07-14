import { test, expect } from '@playwright/test';
import { checkFacebookGroupUrl } from '../../lib/community-health';

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/policestationrepuk';

test.describe('Community forum hub — user journey', () => {
  test('/forum hub shows join guidance and Facebook CTAs', async ({ page }) => {
    const res = await page.goto('/forum');
    expect(res?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: /Community Forum for Police Station/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Not fully qualified yet/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Posting jobs on Facebook/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Need help joining/i })).toBeVisible();

    const facebookLinks = page.locator(`a[href="${FACEBOOK_GROUP_URL}"]`);
    await expect(facebookLinks.first()).toBeVisible();
    expect(await facebookLinks.count()).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < (await facebookLinks.count()); i++) {
      const link = facebookLinks.nth(i);
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('/Forum redirects to /forum', async ({ page }) => {
    const res = await page.goto('/Forum', { waitUntil: 'commit' });
    expect(res?.status()).toBeLessThan(400);
    expect(page.url()).toMatch(/\/forum\/?$/i);
  });

  test('footer Community Forum link reaches /forum', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').getByRole('link', { name: 'Community Forum' }).click();
    await expect(page).toHaveURL(/\/forum\/?$/i);
  });

  test('/WhatsApp links to community forum', async ({ page }) => {
    await page.goto('/WhatsApp');
    await expect(page.getByRole('link', { name: /community forum/i }).first()).toHaveAttribute(
      'href',
      '/forum',
    );
  });

  test('home page links community forum to /forum', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /community forum/i }).first()).toHaveAttribute(
      'href',
      '/forum',
    );
  });

  test('Facebook group URL is reachable', async () => {
    const result = await checkFacebookGroupUrl(FACEBOOK_GROUP_URL);
    expect(result.ok, result.issue ?? 'Facebook group URL failed').toBe(true);
  });
});
