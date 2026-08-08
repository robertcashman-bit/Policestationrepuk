import { NextResponse } from 'next/server';
import { sendStationUpdateNotification } from '@/lib/email';
import {
  getClientIp,
  messageLooksSpammy,
  rateLimitOk,
  validateContactTiming,
} from '@/lib/contact-guards';
import { saveSubmission } from '@/lib/submissions';
import { savePendingStationUpdate } from '@/lib/station-overrides';
import { stationUpdateBodySchema, zodErrorMessage } from '@/lib/validation/public-forms';

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

    const parsed = stationUpdateBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
    }

    const {
      stationId,
      stationName,
      currentAddress,
      currentPostcode,
      currentPhone,
      currentCustodyPhone,
      currentNonEmergencyPhone,
      newAddress,
      newPostcode,
      newPhone,
      newCustodyPhone,
      newNonEmergencyPhone,
      notes,
      submitterName,
      submitterEmail,
      _hp,
      _startedAt,
    } = parsed.data;

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    const timing = validateContactTiming(_startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    if (ip !== 'unknown') {
      const limited = await rateLimitOk({ ip, scope: 'station-update' });
      if (!limited.ok) {
        return NextResponse.json(
          { error: 'Too many submissions recently. Please wait a few minutes and try again.' },
          { status: 429 },
        );
      }
    }

    const hasUpdate =
      newAddress?.trim() ||
      newPostcode?.trim() ||
      newPhone?.trim() ||
      newCustodyPhone?.trim() ||
      newNonEmergencyPhone?.trim();

    if (!hasUpdate) {
      return NextResponse.json(
        { error: 'Please provide at least one updated field (address, postcode, or phone number).' },
        { status: 400 },
      );
    }

    if (notes && messageLooksSpammy(String(notes))) {
      return NextResponse.json(
        { error: 'Your notes could not be processed. Please remove excessive links and try again.' },
        { status: 400 },
      );
    }

    const payload = {
      stationId,
      stationName,
      current: {
        address: currentAddress ?? undefined,
        postcode: currentPostcode ?? undefined,
        phone: currentPhone ?? undefined,
        custodyPhone: currentCustodyPhone ?? undefined,
        nonEmergencyPhone: currentNonEmergencyPhone ?? undefined,
      },
      suggested: {
        address: newAddress?.trim() || undefined,
        postcode: newPostcode?.trim() || undefined,
        phone: newPhone?.trim() || undefined,
        custodyPhone: newCustodyPhone?.trim() || undefined,
        nonEmergencyPhone: newNonEmergencyPhone?.trim() || undefined,
      },
      notes: notes?.trim() || undefined,
      submitterName,
      submitterEmail,
    };

    let submissionId: string;
    try {
      submissionId = await saveSubmission('station-update', payload);
    } catch {
      return NextResponse.json(
        {
          error:
            'Unable to save your suggestion right now. Please try again shortly or email us directly.',
        },
        { status: 503 },
      );
    }

    const notified = await sendStationUpdateNotification(payload);
    if (!notified) {
      console.error('[station-update] notification failed after durable save', { id: submissionId });
    }

    await savePendingStationUpdate({
      id: submissionId,
      stationId: String(stationId),
      stationName: String(stationName),
      fields: {
        address: payload.suggested.address,
        postcode: payload.suggested.postcode,
        phone: payload.suggested.phone,
        custodyPhone: payload.suggested.custodyPhone,
        nonEmergencyPhone: payload.suggested.nonEmergencyPhone,
      },
      notes: payload.notes,
      submitterName: payload.submitterName,
      submitterEmail: payload.submitterEmail,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      id: submissionId,
      message: 'Thank you — your suggestion has been received and will be reviewed.',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
