import { NextResponse } from 'next/server';
import { sendRegistrationNotification } from '@/lib/email';
import { saveSubmission } from '@/lib/submissions';
import { contactRateLimitOk, getClientIp } from '@/lib/contact-guards';

function toStr(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') return val;
  return String(val ?? '');
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!contactRateLimitOk(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { name, email, phone, accreditation, counties, stations, availability, message, _hp } = body;

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const totalLen = JSON.stringify(body).length;
    if (totalLen > 20000 || name.length > 200 || email.length > 320) {
      return NextResponse.json(
        { error: 'Field exceeds maximum length' },
        { status: 400 }
      );
    }

    const normalised = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: toStr(phone),
      accreditation: toStr(accreditation),
      counties: toStr(counties),
      stations: toStr(stations),
      availability: toStr(availability),
      message: toStr(message),
    };

    const [submissionId, emailSent] = await Promise.all([
      saveSubmission('registration', normalised),
      sendRegistrationNotification(normalised),
    ]);

    if (!emailSent) {
      console.warn('[register] admin notification email failed — submission saved as', submissionId);
    }

    return NextResponse.json({ ok: true, id: submissionId });
  } catch (err) {
    console.error('[register] unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong processing your registration. Please try again.' },
      { status: 500 }
    );
  }
}
