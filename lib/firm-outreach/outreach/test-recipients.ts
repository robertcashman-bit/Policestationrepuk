import { normalizeEmail } from '../normalize';

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
}

/** Configured inboxes allowed to receive operator test sends (psaTestSend, local script). */
export function listAllowedTestRecipients(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (email: string) => {
    const norm = normalizeEmail(email);
    if (!norm.includes('@') || seen.has(norm)) return;
    seen.add(norm);
    out.push(norm);
  };

  for (const email of parseEmailList(process.env.FIRM_OUTREACH_TEST_RECIPIENTS)) {
    add(email);
  }
  for (const email of parseEmailList(process.env.FIRM_OUTREACH_DIGEST_EMAIL)) {
    add(email);
  }
  for (const email of parseEmailList(process.env.ADMIN_EMAILS)) {
    add(email);
  }
  const owner = process.env.OWNER_EMAIL?.trim();
  if (owner) add(owner);

  return out;
}

export function isTestRecipientsConfigured(): boolean {
  return listAllowedTestRecipients().length > 0;
}

export function isAllowedTestRecipient(email: string): boolean {
  const norm = normalizeEmail(email);
  if (!norm.includes('@')) return false;
  return listAllowedTestRecipients().includes(norm);
}
