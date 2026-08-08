import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { detectImageMimeFromBytes } from '@/lib/image-magic-bytes';
import { resolveManagementToken } from '@/lib/legal-directory/storage';
import {
  consumeLogoUploadToken,
  restoreLogoUploadToken,
} from '@/lib/legal-directory/logo-upload-token';

export const runtime = 'nodejs';

const MAX_BYTES = 512 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Upload a firm logo for the Legal Services Directory (JPEG/PNG/WebP, max 512KB).
 * Requires BLOB_READ_WRITE_TOKEN plus one of:
 *   - a one-shot upload token (from /api/legal-directory/logo-token)
 *   - a valid listing management token
 *   - an admin session
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { error: 'Logo uploads are not configured on this environment.' },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  const limit = await rateLimitOk({
    ip,
    scope: 'legal-directory-logo',
    max: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  const uploadToken = form.get('uploadToken');
  const managementToken = form.get('managementToken');

  // Reject unexpected fields that look like path traversal attempts in filenames later.
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field.' }, { status: 400 });
  }

  // Validate the payload before consuming a one-shot upload token so common
  // client mistakes (size / type) do not burn authorisation.
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Logo must be 512KB or smaller.' }, { status: 400 });
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageMimeFromBytes(buf);
  if (!detected || !ALLOWED_TYPES.has(detected)) {
    return NextResponse.json(
      { error: 'Logo must be a valid JPEG, PNG, or WebP image.' },
      { status: 400 },
    );
  }

  const admin = await requireAdmin();
  const hasAdmin = admin.ok;
  const hasUploadToken =
    typeof uploadToken === 'string' && (await consumeLogoUploadToken(uploadToken));
  let hasMgmt = false;
  if (typeof managementToken === 'string' && managementToken.length > 16) {
    const resolved = await resolveManagementToken(managementToken);
    hasMgmt = Boolean(resolved);
  }

  if (!hasAdmin && !hasUploadToken && !hasMgmt) {
    return NextResponse.json(
      { error: 'Upload authorisation required. Please reload the form and try again.' },
      { status: 401 },
    );
  }

  // Prefer detected type over client MIME.
  const contentType = detected;
  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const pathname = `legal-directory/logos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const blob = await put(pathname, Buffer.from(buf), {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('[legal-directory/logo] upload failed');
    // Do not burn a valid one-shot token when storage fails after consume.
    if (hasUploadToken && typeof uploadToken === 'string') {
      await restoreLogoUploadToken(uploadToken);
    }
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
