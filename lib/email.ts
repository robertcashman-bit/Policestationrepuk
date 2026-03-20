import { Resend } from 'resend';
import { phoneToTelHref } from '@/lib/phone';

const ADMIN_EMAIL = 'robertcashman@defencelegalservices.co.uk';
const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.com>';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

interface RegistrationSubmission {
  name: string;
  email: string;
  phone?: string;
  accreditation?: string;
  counties?: string;
  stations?: string;
  availability?: string;
  message?: string;
}

export async function sendContactNotification(data: ContactSubmission): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Contact form — no RESEND_API_KEY]', { name: data.name, email: data.email, subject: data.subject });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Contact Form] ${data.subject || 'New enquiry'} — from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          ${data.subject ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Subject</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.subject)}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Message</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.message).replace(/\n/g, '<br>')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent via PoliceStationRepUK contact form</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Contact email failed]', err);
    return false;
  }
}

export async function sendRegistrationNotification(data: RegistrationSubmission): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Registration — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[New Rep Registration] ${data.name}`,
      html: `
        <h2>New Representative Registration</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          ${data.phone ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Phone</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="${escapeHtml(phoneToTelHref(data.phone))}">${escapeHtml(data.phone)}</a></td></tr>` : ''}
          ${data.accreditation ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Accreditation</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.accreditation)}</td></tr>` : ''}
          ${data.counties ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Counties</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.counties)}</td></tr>` : ''}
          ${data.stations ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Stations</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.stations)}</td></tr>` : ''}
          ${data.availability ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Availability</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.availability)}</td></tr>` : ''}
          ${data.message ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Message</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.message).replace(/\n/g, '<br>')}</td></tr>` : ''}
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent via PoliceStationRepUK registration form</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Registration email failed]', err);
    return false;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
