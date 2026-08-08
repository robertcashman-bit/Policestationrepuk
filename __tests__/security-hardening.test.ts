/**
 * Security hardening regression tests (PoliceStationRepUK).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isCronAuthorized } from '@/lib/cron-auth';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { detectImageMimeFromBytes } from '@/lib/image-magic-bytes';
import {
  contactBodySchema,
  authVerifyCodeBodySchema,
} from '@/lib/validation/public-forms';

describe('OTP email subjects', () => {
  it('does not embed magic codes in email subjects', () => {
    const src = readFileSync(join(process.cwd(), 'lib/email.ts'), 'utf-8');
    expect(src).not.toMatch(/subject:\s*`[^`]*\$\{code\}/);
    expect(src).toContain("subject: 'Your PoliceStationRepUK login code'");
    expect(src).toContain("subject: 'Confirm your PoliceStationRepUK enquiry'");
  });
});

describe('cron auth timing-safe', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts matching Bearer secret', () => {
    const req = new Request('http://localhost/api/cron/x', {
      headers: { authorization: 'Bearer super-secret-value' },
    });
    expect(isCronAuthorized(req, 'super-secret-value')).toBe(true);
  });

  it('rejects wrong-length secrets without throwing', () => {
    const req = new Request('http://localhost/api/cron/x', {
      headers: { authorization: 'Bearer short' },
    });
    expect(isCronAuthorized(req, 'super-secret-value')).toBe(false);
  });

  it('denies when secret unset in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const req = new Request('http://localhost/api/cron/x');
    expect(isCronAuthorized(req, '')).toBe(false);
  });
});

describe('sanitizeHtml', () => {
  it('strips script tags and event handlers', () => {
    const dirty =
      '<p>Hello<script>alert(1)</script><img src=x onerror="alert(2)"><a href="javascript:alert(3)">x</a></p>';
    const clean = sanitizeHtml(dirty);
    expect(clean.toLowerCase()).not.toContain('<script');
    expect(clean.toLowerCase()).not.toContain('onerror');
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });

  it('keeps safe formatting tags', () => {
    const clean = sanitizeHtml('<p><strong>Bold</strong> and <em>italic</em></p>');
    expect(clean).toContain('<strong>');
    expect(clean).toContain('<em>');
  });
});

describe('image magic bytes', () => {
  it('detects PNG signature', () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
    ]);
    expect(detectImageMimeFromBytes(png)).toBe('image/png');
  });

  it('rejects non-image bytes', () => {
    const junk = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    expect(detectImageMimeFromBytes(junk)).toBeNull();
  });
});

describe('zod public form schemas', () => {
  it('rejects unexpected fields on contact', () => {
    const result = contactBodySchema.safeParse({
      name: 'Test',
      email: 'a@b.com',
      message: 'Hello there',
      evil: 'field',
    });
    expect(result.success).toBe(false);
  });

  it('rejects oversized contact message', () => {
    const result = contactBodySchema.safeParse({
      name: 'Test',
      email: 'a@b.com',
      message: 'x'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid verify-code payload', () => {
    const result = authVerifyCodeBodySchema.safeParse({
      email: 'Rep@Example.com',
      code: '123456',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('rep@example.com');
    }
  });
});

describe('logo upload route auth', () => {
  it('requires upload authorisation (source guard)', () => {
    const src = readFileSync(
      join(process.cwd(), 'app/api/legal-directory/logo/route.ts'),
      'utf-8',
    );
    expect(src).toContain('consumeLogoUploadToken');
    expect(src).toContain('restoreLogoUploadToken');
    expect(src).toContain('requireAdmin');
    expect(src).toContain('detectImageMimeFromBytes');
    expect(src).toContain('rateLimitOk');
  });
});

describe('submissions durability', () => {
  it('throws when no durable store accepts the write (source guard)', () => {
    const src = readFileSync(join(process.cwd(), 'lib/submissions.ts'), 'utf-8');
    expect(src).toContain('SubmissionPersistError');
    expect(src).toContain('throw new SubmissionPersistError');
  });

  it('contact route does not return ok when saveSubmission fails', () => {
    const src = readFileSync(join(process.cwd(), 'app/api/contact/route.ts'), 'utf-8');
    expect(src).toContain('status: 503');
    expect(src).toMatch(/saveSubmission\([\s\S]*?catch/);
  });
});

describe('ready route recon stripping', () => {
  it('public response omits detailed checks without cron auth (source guard)', () => {
    const src = readFileSync(join(process.cwd(), 'app/api/ready/route.ts'), 'utf-8');
    expect(src).toContain('isCronAuthorized');
    expect(src).toMatch(/\{ ok: ready, timestamp \}/);
  });
});

describe('submissions privacy', () => {
  it('does not log full submission payloads', () => {
    const src = readFileSync(join(process.cwd(), 'lib/submissions.ts'), 'utf-8');
    expect(src).not.toContain('JSON.stringify(record)');
    expect(src).toContain('{ id, type, submitted_at }');
  });
});
