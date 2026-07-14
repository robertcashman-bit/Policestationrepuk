/**
 * Attachment validation for Buffer submissions.
 * Normalises URLs and probes reachability before createPost.
 */
import { assertBufferPostImageReady, isRasterImagePath } from './image-url';
import type { BufferChannelService } from './config';

export type AttachmentValidationCode =
  | 'ok'
  | 'missing_url'
  | 'localhost_or_private'
  | 'insecure_http'
  | 'unsupported_type'
  | 'too_large'
  | 'unreachable'
  | 'html_error_page'
  | 'corrupt_or_invalid';

export interface AttachmentValidationResult {
  ok: boolean;
  code: AttachmentValidationCode;
  normalisedUrl?: string;
  message: string;
}

const PRIVATE_HOST_RE =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;

export function normaliseAttachmentUrl(url: string | undefined | null): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (PRIVATE_HOST_RE.test(parsed.hostname)) return null;
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function validateBufferAttachment(input: {
  imageUrl?: string;
  channelService?: BufferChannelService;
  feedId?: string;
  fetchFn?: typeof fetch;
}): Promise<AttachmentValidationResult> {
  const normalised = normaliseAttachmentUrl(input.imageUrl);
  if (!normalised) {
    return {
      ok: false,
      code: !input.imageUrl?.trim() ? 'missing_url' : 'localhost_or_private',
      message: !input.imageUrl?.trim()
        ? 'Attachment URL is missing'
        : 'Attachment URL is local, private, or invalid',
    };
  }

  if (normalised.startsWith('http://')) {
    return {
      ok: false,
      code: 'insecure_http',
      message: 'Buffer attachments must use HTTPS',
      normalisedUrl: normalised,
    };
  }

  if (input.channelService !== 'googlebusiness' && !isRasterImagePath(normalised)) {
    return {
      ok: false,
      code: 'unsupported_type',
      message: 'non-raster image path',
      normalisedUrl: normalised,
    };
  }

  try {
    const ready = await assertBufferPostImageReady(normalised, input.fetchFn ?? fetch, {
      channelService: input.channelService,
      feedId: input.feedId,
    });
    return {
      ok: true,
      code: 'ok',
      normalisedUrl: ready,
      message: 'Attachment validated',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    let code: AttachmentValidationCode = 'unreachable';
    if (/size|5\s?MB|too large/i.test(message)) code = 'too_large';
    if (/content-type|html|unsupported|non-raster/i.test(message)) code = 'unsupported_type';
    if (/magic|corrupt|invalid image/i.test(message)) code = 'corrupt_or_invalid';
    return { ok: false, code, message, normalisedUrl: normalised };
  }
}
