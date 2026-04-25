import crypto from 'crypto';

const API_BASE = 'https://api.lemonsqueezy.com/v1';

export const PRICING = {
  monthly: { price: 499, label: '£4.99/month', period: 'month', savings: null },
  '3month': { price: 1272, label: '£12.72', period: '3 months', savings: '15% off' },
  '6month': { price: 2246, label: '£22.46', period: '6 months', savings: '25% off' },
  yearly: { price: 3593, label: '£35.93/year', period: 'year', savings: '40% off' },
} as const;

export type PricingTier = keyof typeof PRICING;

export function getVariantId(tier: PricingTier): string | undefined {
  const envMap: Record<PricingTier, string> = {
    monthly: 'LEMONSQUEEZY_VARIANT_MONTHLY',
    '3month': 'LEMONSQUEEZY_VARIANT_3MONTH',
    '6month': 'LEMONSQUEEZY_VARIANT_6MONTH',
    yearly: 'LEMONSQUEEZY_VARIANT_YEARLY',
  };
  return process.env[envMap[tier]];
}

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error('LEMONSQUEEZY_API_KEY not configured');
  return key;
}

function getStoreId(): string {
  const id = process.env.LEMONSQUEEZY_STORE_ID;
  if (!id) throw new Error('LEMONSQUEEZY_STORE_ID not configured');
  return id;
}

export interface CheckoutOptions {
  variantId: string;
  email: string;
  name?: string;
  successUrl: string;
  cancelUrl?: string;
  customData?: Record<string, string>;
}

export interface CheckoutResponse {
  url: string;
  checkoutId: string;
}

export async function createCheckout(opts: CheckoutOptions): Promise<CheckoutResponse> {
  const apiKey = getApiKey();
  const storeId = getStoreId();

  const payload = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: opts.email,
          name: opts.name,
          custom: opts.customData ?? {},
        },
        checkout_options: {
          embed: false,
          media: false,
          button_color: '#1e3a5f',
        },
        product_options: {
          redirect_url: opts.successUrl,
        },
      },
      relationships: {
        store: {
          data: {
            type: 'stores',
            id: storeId,
          },
        },
        variant: {
          data: {
            type: 'variants',
            id: opts.variantId,
          },
        },
      },
    },
  };

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error('[lemonsqueezy] Checkout creation failed:', res.status, errBody);
    throw new Error(`Lemon Squeezy checkout failed: ${res.status}`);
  }

  const json = await res.json();
  const checkoutUrl = json.data?.attributes?.url;
  const checkoutId = json.data?.id;

  if (!checkoutUrl) {
    throw new Error('No checkout URL returned from Lemon Squeezy');
  }

  return { url: checkoutUrl, checkoutId };
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET not configured');
    return false;
  }

  const hmac = crypto.createHmac('sha256', secret);
  const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf8');
  const digest = hmac.update(payloadStr).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export interface WebhookEvent {
  meta: {
    event_name: string;
    custom_data?: Record<string, string>;
  };
  data: {
    id: string;
    type: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      product_id: number;
      variant_id: number;
      user_email: string;
      user_name: string;
      status: string;
      ends_at: string | null;
      renews_at: string | null;
      created_at: string;
      updated_at: string;
      cancelled: boolean;
    };
  };
}

export function parseWebhookEvent(body: string): WebhookEvent {
  return JSON.parse(body) as WebhookEvent;
}

export type SubscriptionEventType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed';

export function isSubscriptionEvent(eventName: string): eventName is SubscriptionEventType {
  return eventName.startsWith('subscription_');
}
