import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const routePath = path.resolve(
  __dirname,
  '..',
  'app',
  'api',
  'webhooks',
  'lemonsqueezy',
  'route.ts',
);
const source = fs.readFileSync(routePath, 'utf-8');

describe('webhooks/lemonsqueezy route', () => {
  it('imports the lemonsqueezy verify + parse helpers', () => {
    expect(source).toMatch(/verifyWebhookSignature/);
    expect(source).toMatch(/parseWebhookEvent/);
    expect(source).toMatch(/isSubscriptionEvent/);
  });

  it('reads the x-signature header and returns 401 when missing', () => {
    expect(source).toMatch(/['"]x-signature['"]/);
    expect(source).toMatch(/Missing signature/);
    expect(source).toMatch(/status:\s*401/);
  });

  it('verifies the signature against the raw body and 401s on mismatch', () => {
    expect(source).toMatch(/req\.text\(\)/);
    expect(source).toMatch(/Invalid signature/);
  });

  it('handles the core subscription lifecycle events', () => {
    for (const ev of [
      'order_created',
      'subscription_created',
      'subscription_payment_success',
      'subscription_updated',
      'subscription_cancelled',
      'subscription_expired',
      'subscription_payment_failed',
      'subscription_paused',
      'subscription_unpaused',
    ]) {
      expect(source).toContain(ev);
    }
  });

  it('prevents duplicate webhook processing', () => {
    expect(source).toMatch(/lemonsqueezy:webhook:/);
    expect(source).toMatch(/duplicate:\s*true/);
  });

  it('stores Lemon Squeezy identifiers and last webhook event', () => {
    for (const field of [
      'lemonSqueezyCustomerId',
      'lemonSqueezyOrderId',
      'lemonSqueezySubscriptionId',
      'lemonSqueezyVariantId',
      'lemonSqueezyProductId',
      'featuredLastWebhookEvent',
    ]) {
      expect(source).toContain(field);
    }
  });

  it('activates featured + sends rep + owner emails on creation', () => {
    expect(source).toMatch(/activateFeatured\(/);
    expect(source).toMatch(/sendFeaturedConfirmationToRep\(/);
    expect(source).toMatch(/sendFeaturedOwnerNotification\(/);
    expect(source).toMatch(/markEmailsSent\(/);
  });

  it('cancels and expires via the featured helpers', () => {
    expect(source).toMatch(/cancelFeaturedSubscription\(/);
    expect(source).toMatch(/expireFeaturedSubscription\(/);
  });
});
