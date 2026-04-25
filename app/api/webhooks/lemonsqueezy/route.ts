import { NextRequest, NextResponse } from 'next/server';
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  isSubscriptionEvent,
} from '@/lib/lemonsqueezy';
import {
  activateFeatured,
  updateFeaturedSubscription,
  cancelFeaturedSubscription,
  expireFeaturedSubscription,
  markEmailsSent,
  getFeaturedStatus,
} from '@/lib/featured';
import {
  sendFeaturedConfirmationToRep,
  sendFeaturedOwnerNotification,
} from '@/lib/email';
import { getRawReps, getRegisteredRepByEmail } from '@/lib/data';
import type { Representative } from '@/lib/types';

async function findRep(email: string): Promise<Representative | null> {
  const reps = getRawReps();
  const staticRep = reps.find((r) => r.email.toLowerCase() === email.toLowerCase());
  if (staticRep) return staticRep;
  return getRegisteredRepByEmail(email);
}

function hasNotExpired(meta: { expiresAt?: string }): boolean {
  if (!meta.expiresAt) return true;
  return new Date(meta.expiresAt) > new Date();
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-signature');
  if (!signature) {
    console.error('[webhook] Missing X-Signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event;
  try {
    event = parseWebhookEvent(rawBody);
  } catch (err) {
    console.error('[webhook] Failed to parse event:', err);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  console.log('[webhook] Received event:', eventName);

  if (!isSubscriptionEvent(eventName)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const attrs = event.data.attributes;
  const email = event.meta.custom_data?.email || attrs.user_email;
  const tier = event.meta.custom_data?.tier;
  const repSlug = event.meta.custom_data?.repSlug;

  if (!email) {
    console.error('[webhook] No email in event');
    return NextResponse.json({ error: 'No email' }, { status: 400 });
  }

  const subscriptionId = event.data.id;
  const variantId = String(attrs.variant_id);
  const customerId = String(attrs.customer_id);
  const renewsAt = attrs.renews_at || undefined;
  const endsAt = attrs.ends_at || undefined;

  try {
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed': {
        const existing = await getFeaturedStatus(email);
        const shouldPreserveActivation =
          existing &&
          (existing.status === 'active' ||
            (eventName === 'subscription_resumed' && hasNotExpired(existing)));

        if (shouldPreserveActivation) {
          await updateFeaturedSubscription(email, {
            status: 'active',
            subscriptionId,
            variantId,
            customerId,
            tier,
            renewsAt,
            expiresAt: endsAt,
          });
        } else {
          const meta = await activateFeatured(email, {
            subscriptionId,
            variantId,
            customerId,
            tier,
            renewsAt,
            expiresAt: endsAt,
          });

          const rep = await findRep(email);
          if (rep) {
            const [repEmailSent, ownerEmailSent] = await Promise.all([
              sendFeaturedConfirmationToRep({
                name: rep.name,
                email: rep.email,
                activatedAt: meta.activatedAt,
              }).catch((err) => {
                console.error('[webhook] Rep email failed:', err);
                return false;
              }),
              sendFeaturedOwnerNotification({
                name: rep.name,
                email: rep.email,
                repSlug: repSlug || rep.slug,
                activatedAt: meta.activatedAt,
              }).catch((err) => {
                console.error('[webhook] Owner email failed:', err);
                return false;
              }),
            ]);

            await markEmailsSent(email, {
              rep: repEmailSent,
              owner: ownerEmailSent,
            }).catch((err) => console.warn('[webhook] markEmailsSent failed:', err));
          }
        }
        break;
      }

      case 'subscription_updated': {
        await updateFeaturedSubscription(email, {
          renewsAt,
          expiresAt: endsAt,
        });
        break;
      }

      case 'subscription_cancelled': {
        const cancelEndsAt = endsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await cancelFeaturedSubscription(email, cancelEndsAt);
        break;
      }

      case 'subscription_expired': {
        await expireFeaturedSubscription(email);
        break;
      }

      case 'subscription_paused': {
        await updateFeaturedSubscription(email, { status: 'cancelled' });
        break;
      }

      case 'subscription_unpaused': {
        await updateFeaturedSubscription(email, { status: 'active' });
        break;
      }

      default:
        console.log('[webhook] Unhandled subscription event:', eventName);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook] Error processing event:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
