import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import {
  PRICING,
  getVariantId,
  readEnv,
  createCheckout,
  verifyWebhookSignature,
  parseWebhookEvent,
  isSubscriptionEvent,
} from '@/lib/lemonsqueezy';

const ORIG_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIG_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
  process.env = { ...ORIG_ENV };
});

describe('lemonsqueezy: PRICING + getVariantId', () => {
  it('exposes the four pricing tiers', () => {
    expect(Object.keys(PRICING).sort()).toEqual(['3month', '6month', 'monthly', 'yearly']);
  });

  it('returns the variant id from the env, trimming whitespace/CRLF', () => {
    process.env.LEMONSQUEEZY_VARIANT_MONTHLY = '  1576223\r\n';
    expect(getVariantId('monthly')).toBe('1576223');
  });

  it('supports the requested LEMON_SQUEEZY_FEATURED_VARIANT_ID alias for monthly', () => {
    delete process.env.LEMONSQUEEZY_VARIANT_MONTHLY;
    process.env.LEMON_SQUEEZY_FEATURED_VARIANT_ID = '  1576223\r\n';
    expect(getVariantId('monthly')).toBe('1576223');
  });

  it('returns undefined for tiers with no env configured', () => {
    delete process.env.LEMONSQUEEZY_VARIANT_YEARLY;
    expect(getVariantId('yearly')).toBeUndefined();
  });
});

describe('lemonsqueezy: readEnv', () => {
  it('strips trailing CR/LF that Vercel CLI may include in pasted values', () => {
    process.env.SOMETHING = 'abc\r\n';
    expect(readEnv('SOMETHING')).toBe('abc');
  });

  it('returns undefined for missing or whitespace-only values', () => {
    process.env.EMPTY = '   \r\n';
    expect(readEnv('EMPTY')).toBeUndefined();
    expect(readEnv('NOT_SET')).toBeUndefined();
  });
});

describe('lemonsqueezy: createCheckout', () => {
  it('throws if LEMON_SQUEEZY_API_KEY is missing', async () => {
    delete process.env.LEMONSQUEEZY_API_KEY;
    delete process.env.LEMON_SQUEEZY_API_KEY;
    process.env.LEMONSQUEEZY_STORE_ID = '351887';
    await expect(
      createCheckout({
        variantId: '1',
        email: 'x@example.com',
        successUrl: 'https://example.com/ok',
      }),
    ).rejects.toThrow(/LEMON_SQUEEZY_API_KEY/);
  });

  it('throws if LEMONSQUEEZY_STORE_ID is missing', async () => {
    process.env.LEMON_SQUEEZY_API_KEY = 'k';
    delete process.env.LEMONSQUEEZY_STORE_ID;
    delete process.env.LEMON_SQUEEZY_STORE_ID;
    await expect(
      createCheckout({
        variantId: '1',
        email: 'x@example.com',
        successUrl: 'https://example.com/ok',
      }),
    ).rejects.toThrow(/LEMON_SQUEEZY_STORE_ID/);
  });

  it('posts a JSON:API payload to /v1/checkouts and returns the checkout URL', async () => {
    process.env.LEMON_SQUEEZY_API_KEY = '  jwt-key\r\n';
    process.env.LEMON_SQUEEZY_STORE_ID = '351887\r\n';

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: { id: 'co_123', attributes: { url: 'https://store.lemonsqueezy.com/buy/abc' } },
        }),
        { status: 201, headers: { 'content-type': 'application/vnd.api+json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createCheckout({
      variantId: '1576223',
      email: 'rep@example.com',
      name: 'Rep Example',
      successUrl: 'https://policestationrepuk.org/Account?featured=success',
      customData: { email: 'rep@example.com', tier: 'monthly', repSlug: 'rep-example' },
    });

    expect(result).toEqual({ url: 'https://store.lemonsqueezy.com/buy/abc', checkoutId: 'co_123' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.lemonsqueezy.com/v1/checkouts');

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer jwt-key');
    expect(headers['Content-Type']).toBe('application/vnd.api+json');

    const body = JSON.parse(init.body as string);
    expect(body.data.relationships.store.data.id).toBe('351887');
    expect(body.data.relationships.variant.data.id).toBe('1576223');
    expect(body.data.attributes.checkout_data.email).toBe('rep@example.com');
    expect(body.data.attributes.checkout_data.custom).toEqual({
      email: 'rep@example.com',
      tier: 'monthly',
      repSlug: 'rep-example',
    });
    expect(body.data.attributes.product_options.redirect_url).toBe(
      'https://policestationrepuk.org/Account?featured=success',
    );
  });

  it('throws when LS responds with a non-2xx status', async () => {
    process.env.LEMON_SQUEEZY_API_KEY = 'k';
    process.env.LEMON_SQUEEZY_STORE_ID = '351887';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 422 })),
    );
    await expect(
      createCheckout({
        variantId: '1',
        email: 'x@example.com',
        successUrl: 'https://example.com/ok',
      }),
    ).rejects.toThrow(/422/);
  });

  it('throws when LS response is missing data.attributes.url', async () => {
    process.env.LEMON_SQUEEZY_API_KEY = 'k';
    process.env.LEMON_SQUEEZY_STORE_ID = '351887';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: 'x' } }), { status: 201 })),
    );
    await expect(
      createCheckout({
        variantId: '1',
        email: 'x@example.com',
        successUrl: 'https://example.com/ok',
      }),
    ).rejects.toThrow(/No checkout URL/);
  });
});

describe('lemonsqueezy: verifyWebhookSignature', () => {
  const secret = 'psruk_test_secret';
  const payload = '{"meta":{"event_name":"subscription_created"}}';

  function sign(body: string, key = secret) {
    return crypto.createHmac('sha256', key).update(body).digest('hex');
  }

  it('returns true for a matching signature', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    expect(verifyWebhookSignature(payload, sign(payload))).toBe(true);
  });

  it('trims whitespace from the secret env var', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = `${secret}\r\n`;
    expect(verifyWebhookSignature(payload, sign(payload))).toBe(true);
  });

  it('returns false for a tampered payload', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    const goodSig = sign(payload);
    expect(verifyWebhookSignature(`${payload}!`, goodSig)).toBe(false);
  });

  it('returns false (and does not throw) for a wrong-length signature', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    expect(verifyWebhookSignature(payload, 'abc')).toBe(false);
  });

  it('returns false when the signature header is missing', () => {
    process.env.LEMONSQUEEZY_WEBHOOK_SECRET = secret;
    expect(verifyWebhookSignature(payload, null)).toBe(false);
    expect(verifyWebhookSignature(payload, undefined)).toBe(false);
  });

  it('returns false when the secret is not configured', () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    expect(verifyWebhookSignature(payload, sign(payload, 'any'))).toBe(false);
  });
});

describe('lemonsqueezy: parseWebhookEvent + isSubscriptionEvent', () => {
  it('parses JSON bodies', () => {
    const ev = parseWebhookEvent(
      JSON.stringify({
        meta: { event_name: 'subscription_created' },
        data: { id: 's', type: 'subscriptions', attributes: {} },
      }),
    );
    expect(ev.meta.event_name).toBe('subscription_created');
  });

  it('flags subscription_* events', () => {
    expect(isSubscriptionEvent('subscription_created')).toBe(true);
    expect(isSubscriptionEvent('order_created')).toBe(true);
    expect(isSubscriptionEvent('order_refunded')).toBe(false);
  });
});
