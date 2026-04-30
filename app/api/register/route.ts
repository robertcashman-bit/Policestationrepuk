import { NextResponse } from 'next/server';
import { sendRegistrationNotification } from '@/lib/email';
import { saveSubmission } from '@/lib/submissions';
import { contactRateLimitOk, getClientIp } from '@/lib/contact-guards';
import { getKV } from '@/lib/kv';
import { getRawReps } from '@/lib/data';
import {
  countiesToStorageString,
  validateEnglishCountySelections,
  validateOptionalRegistrationPhone,
} from '@/lib/english-counties';

function toStr(val: unknown): string {
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'string') return val;
  return String(val ?? '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      accreditation,
      counties,
      coverage_areas,
      stations,
      availability,
      message,
      _hp,
    } = body;

    if (_hp) {
      return NextResponse.json({ ok: true, id: 'noop' });
    }

    const nameTrim = String(name ?? '').trim();
    const emailTrim = String(email ?? '').trim();
    if (!nameTrim || !emailTrim) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const totalLen = JSON.stringify(body).length;
    if (totalLen > 20000 || nameTrim.length > 200 || emailTrim.length > 320) {
      return NextResponse.json(
        { error: 'Field exceeds maximum length' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    if (!contactRateLimitOk(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const countyCheck = validateEnglishCountySelections(counties);
    if (!countyCheck.ok) {
      return NextResponse.json({ error: countyCheck.error }, { status: 400 });
    }

    const phoneCheck = validateOptionalRegistrationPhone(phone);
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.error }, { status: 400 });
    }

    const coverageAreasStr =
      typeof coverage_areas === 'string' ? coverage_areas.trim().slice(0, 5000) : '';

    const normalised = {
      name: nameTrim,
      email: emailTrim.toLowerCase(),
      phone: toStr(phone),
      accreditation: toStr(accreditation),
      counties: countiesToStorageString(countyCheck.canonical),
      coverage_areas: coverageAreasStr,
      stations: toStr(stations),
      availability: toStr(availability),
      message: toStr(message),
    };

    // Guard against unauthenticated overwrite of an existing rep's directory
    // listing. The registration endpoint is public; without this check, anyone
    // could re-POST with a victim's email to rewrite their public name/phone/
    // counties/stations and change their slug (breaking existing URLs/SEO).
    const kv = getKV();
    if (kv) {
      try {
        const existing = await kv.get(`newrep:${normalised.email}`);
        if (existing) {
          return NextResponse.json(
            {
              error:
                'This email is already registered in our directory. Please log in via the account page to update your listing.',
            },
            { status: 409 },
          );
        }
      } catch (err) {
        console.warn('[register] KV duplicate-check failed:', err);
      }
    }
    const staticRep = getRawReps().find(
      (r) => r.email.toLowerCase() === normalised.email,
    );
    if (staticRep) {
      return NextResponse.json(
        {
          error:
            'This email is already in our directory. Please log in via the account page to update your listing.',
        },
        { status: 409 },
      );
    }

    const kvWrite = (async () => {
      if (!kv) return;
      await kv.set(`newrep:${normalised.email}`, {
        ...normalised,
        registeredAt: new Date().toISOString(),
      });
    })().catch((err) => console.warn('[register] KV directory write failed:', err));

    const [submissionId, emailSent] = await Promise.all([
      saveSubmission('registration', normalised),
      sendRegistrationNotification(normalised),
      kvWrite,
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
