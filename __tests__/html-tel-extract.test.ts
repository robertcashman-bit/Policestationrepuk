import { describe, expect, it } from 'vitest';
import { extractTelHrefs, htmlToSearchableText } from '@/lib/custody-discovery/html-text';
import { extractPhonesFromText } from '@/lib/custody-discovery/phone';

describe('html tel: extraction', () => {
  it('preserves tel: href numbers that tag-stripping would erase', () => {
    const html = `
      <html><body>
        <h1>Sevenoaks Police Station</h1>
        <p>Public enquiry office</p>
        <a href="tel:+441732771055">Call us</a>
      </body></html>
    `;
    const strippedOnly = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    expect(extractPhonesFromText(strippedOnly)).toHaveLength(0);

    const text = htmlToSearchableText(html);
    const phones = extractPhonesFromText(text);
    expect(phones.length).toBeGreaterThan(0);
    expect(phones.some((p) => p.normalized.includes('1732771055') || p.normalized.includes('01732771055'))).toBe(
      true,
    );
  });

  it('extractTelHrefs decodes URI components', () => {
    expect(extractTelHrefs('<a href="tel:%2B441234567890">x</a>')).toEqual(['+441234567890']);
  });
});
