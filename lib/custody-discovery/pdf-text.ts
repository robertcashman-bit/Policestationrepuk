/**
 * Lightweight PDF text extraction for custody discovery.
 * Prefer readable PDF string literals; does not invent numbers.
 * Full OCR / JS-rendered PDFs are out of scope here.
 */

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 4_000_000; // 4MB cap

/** Pull printable strings from a PDF buffer (parentheses strings + UTF-16BE hex). */
export function extractTextFromPdfBuffer(buf: Buffer | Uint8Array): string {
  const raw = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const asLatin = raw.toString('latin1');
  const parts: string[] = [];

  // Literal strings: (....) with basic escape handling
  for (const m of asLatin.matchAll(/\((?:\\.|[^\\)]){2,200}\)/g)) {
    const inner = m[0]
      .slice(1, -1)
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
    if (/[A-Za-z0-9]/.test(inner)) parts.push(inner);
  }

  // Common uncompressed text between BT ... ET
  for (const m of asLatin.matchAll(/BT([\s\S]{0,4000}?)ET/g)) {
    const chunk = m[1] ?? '';
    const tj = [...chunk.matchAll(/\((?:\\.|[^\\)]){2,200}\)\s*Tj/g)].map((x) =>
      x[0].replace(/\)\s*Tj$/, '').slice(1).replace(/\\([nrt()\\])/g, ' '),
    );
    if (tj.length) parts.push(tj.join(' '));
  }

  // Phone-like digit runs already present as ASCII in streams
  const phoneish = asLatin.match(/(?:\+44\s?|0)(?:\d[\s\-().]{0,3}){9,12}\d/g) ?? [];
  parts.push(...phoneish);

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export async function fetchPdfText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PoliceStationRepUK-CustodyDiscovery/1.0 (+https://policestationrepuk.org)',
        Accept: 'application/pdf,*/*',
      },
    });
    if (!res.ok) return null;
    const ctype = res.headers.get('content-type') ?? '';
    if (ctype && !/pdf|octet-stream/i.test(ctype) && !/\.pdf(\?|$)/i.test(url)) {
      return null;
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength === 0 || ab.byteLength > MAX_BYTES) return null;
    const text = extractTextFromPdfBuffer(Buffer.from(ab));
    return text.length >= 20 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}
