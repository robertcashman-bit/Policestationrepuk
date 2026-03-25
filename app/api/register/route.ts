import { NextResponse } from 'next/server';
import { sendRegistrationNotification } from '@/lib/email';
import { saveSubmission } from '@/lib/submissions';

export async function POST(request: Request) {
  try {
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

    const [submissionId] = await Promise.all([
      saveSubmission('registration', {
        name,
        email,
        phone,
        accreditation,
        counties,
        stations,
        availability,
        message,
      }),
      sendRegistrationNotification({
        name,
        email,
        phone,
        accreditation,
        counties,
        stations,
        availability,
        message,
      }),
    ]);

    return NextResponse.json({ ok: true, id: submissionId });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
