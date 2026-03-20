/**
 * Resolve blog article pages: mirror (data/pages.json) when usable;
 * otherwise synthesise readable professional content (crawl returned 404 shells).
 */

import type { MirrorPage } from './mirror-data';
import { getMirrorPage } from './mirror-data';

const PLACEHOLDER_H1 = /^404$/i;
const JUNK_SNIPPETS = [/page not found/i, /could not be found in this application/i];

export function humanizeBlogSlug(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function isUsableBlogMirror(page: MirrorPage | null): boolean {
  if (!page?.content) return false;
  const h1 = page.headings?.find((h) => h.level === 1)?.text?.trim() ?? '';
  if (PLACEHOLDER_H1.test(h1)) return false;
  if (JUNK_SNIPPETS.some((re) => re.test(page.content))) return false;
  if (page.content.replace(/\s/g, '').length < 120) return false;
  return true;
}

export interface FallbackBlogArticle {
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
}

export function buildFallbackBlogArticle(slug: string): FallbackBlogArticle {
  const topic = humanizeBlogSlug(slug);
  const title = topic;

  const intro = `This article discusses ${topic} for criminal defence solicitors, accredited police station representatives, and professionals involved in police station attendance across England and Wales. It is intended as practical orientation only and does not replace case-specific legal advice, firm risk management, or your own professional judgment.`;

  return {
    title,
    intro,
    sections: [
      {
        heading: 'Why this matters at the police station stage',
        paragraphs: [
      `Early decisions in a police investigation—disclosure review, interview strategy, special measures, and representations on bail or release—often shape the rest of the case. ${topic} frequently arises in this context when advising detainees, reviewing the basis for detention, or supporting the instructing solicitor with a clear attendance note.`,
      `Accredited representatives and duty solicitors share a common duty to protect the detainee's rights under PACE and the Codes of Practice, while maintaining confidentiality and accurate records for the firm that instructs you.`,
        ],
      },
      {
        heading: 'How to use PoliceStationRepUK alongside your practice',
        paragraphs: [
          `The PoliceStationRepUK directory is free to search. Firms use it to find cover by county and custody suite; representatives use it to be visible for outsourced attendance. If you need a colleague for an urgent suite, start from the directory and confirm coverage and accreditation directly with the representative you instruct.`,
          'For listing updates, registration, or featured visibility, use the Contact page or the registration flow linked from the site header.',
        ],
      },
      {
        heading: 'Next steps',
        paragraphs: [
      `If you are researching ${topic}, cross-check with your firm’s policies, the latest PACE codes, and any local force guidance. For peer-written procedural depth, explore the Rep Wiki and Legal Updates sections of this site.`,
        ],
      },
    ],
  };
}

export type ResolvedBlogArticle =
  | { kind: 'mirror'; page: MirrorPage }
  | { kind: 'fallback'; pathStr: string; slug: string; data: FallbackBlogArticle };

export function resolveBlogArticle(pathStr: string, slugSegment: string): ResolvedBlogArticle {
  const mirror = getMirrorPage(pathStr);
  if (mirror && isUsableBlogMirror(mirror)) {
    return { kind: 'mirror', page: mirror };
  }
  return {
    kind: 'fallback',
    pathStr,
    slug: slugSegment,
    data: buildFallbackBlogArticle(slugSegment),
  };
}

