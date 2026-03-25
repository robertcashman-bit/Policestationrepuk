import { NextResponse } from 'next/server';
import { sendContactNotification } from '@/lib/email';
import { saveSubmission } from '@/lib/submissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
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

    if (name.length > 200 || email.length > 320 || message.length > 10000 || (subject && subject.length > 500)) {
      return NextResponse.json(
        { error: 'Field exceeds maximum length' },
        { status: 400 }
      );
    }

    const [submissionId] = await Promise.all([
      saveSubmission('contact', { name, email, subject, message }),
      sendContactNotification({ name, email, subject, message }),
    ]);

    return NextResponse.json({ ok: true, id: submissionId });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
