import { NextResponse } from 'next/server';
import { sendContactNotification } from '@/lib/email';
import {
  getClientIp,
  messageLooksSpammy,
  rateLimitOk,
  validateContactTiming,
} from '@/lib/contact-guards';
import { saveSubmission } from '@/lib/submissions';
import { contactBodySchema, zodErrorMessage } from '@/lib/validation/public-forms';

export async function POST(request: Request) {
  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (JSON.stringify(raw).length > 25000) {
      return NextResponse.json({ error: 'Request too large' }, { status: 400 });
    }

    const parsed = contactBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }

    const { name, email, subject, message, _hp, _startedAt } = parsed.data;

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    const timing = validateContactTiming(_startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const limited = await rateLimitOk({ ip, scope: 'contact' });
      if (!limited.ok) {
        return NextResponse.json(
          {
            error:
              'Too many messages sent from this connection recently. Please wait a few minutes or email us directly.',
          },
          { status: 429 },
        );
      }
    }

    if (messageLooksSpammy(String(message))) {
      return NextResponse.json(
        {
          error:
            'Your message could not be sent automatically. If you need to share many links, please email us directly using the address above.',
        },
        { status: 400 },
      );
    }

    let submissionId: string;
    try {
      submissionId = await saveSubmission('contact', { name, email, subject, message });
    } catch {
      return NextResponse.json(
        { error: 'Unable to save your enquiry right now. Please try again or email us directly.' },
        { status: 503 },
      );
    }

    const notified = await sendContactNotification({
      name,
      email,
      subject: subject ?? undefined,
      message,
    });
    if (!notified) {
      console.error('[contact] notification failed after durable save', { id: submissionId });
    }

    return NextResponse.json({
      ok: true,
      id: submissionId,
      message: 'Thank you — your enquiry has been received.',
    });
  } catch (err) {
    console.error('[contact] request failed');
    return NextResponse.json({ error: 'Unable to process your enquiry right now.' }, { status: 500 });
  }
}
