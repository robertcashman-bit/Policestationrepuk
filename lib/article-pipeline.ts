import type { WikiArticle, ArticleSource } from './types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  valid: boolean;
  issues: string[];
}

export interface SourceValidationResult extends ValidationResult {
  parsedSources: ArticleSource[];
}

export interface HallucinationResult extends ValidationResult {
  flaggedPhrases: string[];
}

export interface AutoFixResult {
  article: WikiArticle;
  fixesApplied: string[];
}

export interface PipelineResult {
  status: 'PASS' | 'FAIL';
  issues: string[];
  fixesApplied: string[];
  article: WikiArticle;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const APPROVED_DOMAINS = [
  'gov.uk',
  'legislation.gov.uk',
  'sra.org.uk',
  'lawcare.org.uk',
  'ico.org.uk',
  'college.police.uk',
  'echr.coe.int',
  'npcc.police.uk',
  'judiciary.uk',
  'justice.gov.uk',
  'cps.gov.uk',
  'sentencingcouncil.org.uk',
];

const HEDGE_PHRASES = [
  'generally speaking',
  'it is often the case',
  'typically in most cases',
  'it is widely believed',
  'some experts suggest',
  'it is commonly thought',
  'many people believe',
  'it is generally accepted',
  'as a rule of thumb',
  'in most situations',
];

const KNOWN_LEGISLATION: string[] = [
  'police and criminal evidence act 1984',
  'pace 1984',
  'pace codes of practice',
  'pace code a',
  'pace code b',
  'pace code c',
  'pace code d',
  'pace code e',
  'pace code f',
  'pace code g',
  'pace code h',
  'police reform act 2002',
  'legal aid, sentencing and punishment of offenders act 2012',
  'laspo 2012',
  'criminal legal aid (remuneration) regulations 2013',
  'criminal legal aid (general) (amendment) regulations',
  'mental capacity act 2005',
  'youth justice and criminal evidence act 1999',
  'equality act 2010',
  'fraud act 2006',
  'proceeds of crime act 2002',
  'data protection act 2018',
  'uk gdpr',
  'general data protection regulation',
  'human rights act 1998',
  'criminal justice and public order act 1994',
  'sra standards and regulations',
  'sra code of conduct',
  'sra code of conduct for solicitors',
  'crime and disorder act 1998',
  'criminal justice act 2003',
  'criminal justice act 1967',
  'magistrates\' courts act 1980',
  'bail act 1976',
  'theft act 1968',
  'offences against the person act 1861',
  'misuse of drugs act 1971',
  'road traffic act 1988',
  'regulation of investigatory powers act 2000',
  'investigatory powers act 2016',
  'terrorism act 2000',
  'terrorism act 2006',
  'serious organised crime and police act 2005',
  'children act 1989',
  'children act 2004',
  'mental health act 1983',
  'coroners and justice act 2009',
  'domestic abuse act 2021',
  'modern slavery act 2015',
  'sexual offences act 2003',
  'protection of freedoms act 2012',
  'police reform and social responsibility act 2011',
  'policing and crime act 2017',
  'police act 1996',
  'police act 1997',
  'prosecution of offences act 1985',
  'criminal attempts act 1981',
  'accessories and abettors act 1861',
  'contempt of court act 1981',
  'rehabilitation of offenders act 1974',
  'sentencing act 2020',
  'drugs act 2005',
  'psychoactive substances act 2016',
  'immigration act 1971',
  'immigration act 2014',
  'anti-social behaviour, crime and policing act 2014',
  'criminal evidence act 1898',
  'criminal evidence (witness anonymity) act 2008',
  'criminal justice and police act 2001',
  'police (property) act 1897',
  'criminal appeal act 1968',
  'criminal appeal act 1995',
  'serious crime act 2007',
  'serious crime act 2015',
  'legal services act 2007',
  'solicitors act 1974',
  'courts act 2003',
  'powers of criminal courts (sentencing) act 2000',
  'criminal justice and courts act 2015',
  'extradition act 2003',
  'crime (sentences) act 1997',
  'sexual offences (amendment) act 1992',
  'protection from harassment act 1997',
  'malicious communications act 1988',
  'communications act 2003',
  'proceeds of crime act 2002 (external requests and orders) order 2005',
  'criminal finances act 2017',
  'police (detention and bail) act 2011',
  'crime and security act 2010',
  'safeguarding vulnerable groups act 2006',
  'youth justice and criminal evidence act 1999',
  'criminal procedure and investigations act 1996',
  'criminal damage act 1971',
  'public order act 1986',
  'firearms act 1968',
  'computer misuse act 1990',
  'criminal law act 1967',
  'standard crime contract',
  'police (conduct) regulations 2020',
  'police reform act 2002 (complaints and misconduct) regulations 2020',
  'iopc statutory guidance',
];

const LEGAL_CLAIM_INDICATORS = [
  'is required by law',
  'must by law',
  'shall be',
  'is a statutory requirement',
  'the law requires',
  'legally obligated',
  'under a legal duty',
  'criminal offence to',
  'is unlawful',
  'is illegal',
];

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'your', 'you', 'we', 'our', 'their',
  'how', 'what', 'when', 'where', 'which', 'who', 'why', 'not', 'no',
  'all', 'each', 'every', 'any', 'as', 'if', 'so', 'up', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'out', 'off', 'then', 'than', 'too',
  'very', 'just', 'also', 'more', 'most', 'other', 'some', 'such',
  'only', 'own', 'same', 'here', 'there', 'both', 'few', 'many',
  'much', 'well', 'back', 'even', 'still', 'new', 'now', 'way',
  'use', 'her', 'him', 'his', 'she', 'he', 'they', 'them', 'my',
  'me', 'us', 'complete', 'guide', 'uk', 'police', 'station',
]);

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function countWords(text: string): number {
  return text
    .replace(/[#*_\[\]()>|`~-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function extractH2Headings(content: string): string[] {
  const headings: string[] = [];
  const regex = /^##\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    headings.push(match[1].trim());
  }
  return headings;
}

function hasIntroBeforeFirstHeading(content: string): boolean {
  const lines = content.split('\n');
  let foundH1 = false;
  let textAfterH1 = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!foundH1) {
      if (/^#\s/.test(trimmed)) {
        foundH1 = true;
        continue;
      }
      if (/^##\s/.test(trimmed)) {
        return false;
      }
      if (trimmed.length > 0 && !trimmed.startsWith('#')) {
        return true;
      }
    } else {
      if (/^##\s/.test(trimmed)) {
        break;
      }
      if (trimmed.length > 0 && !trimmed.startsWith('#')) {
        textAfterH1 += trimmed + ' ';
      }
    }
  }

  return textAfterH1.trim().length > 30;
}

function tokenizeForMatching(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return new Set(words);
}

function isApprovedDomain(url: string): boolean {
  if (url.startsWith('/')) return true;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return APPROVED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Step 1 — generateArticle                                          */
/* ------------------------------------------------------------------ */

export function generateArticle(topic: string): WikiArticle {
  const title = topic
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const slug = slugify(topic);
  const now = new Date().toISOString();

  const content = `# ${title}

[Provide a practical, specific introduction to ${topic} in the context of police station representation in England and Wales. Avoid generic opening statements.]

## Key Points

- [Key point 1 with citation]
- [Key point 2 with citation]
- [Key point 3 with citation]

## Legal Framework

[Explain the relevant legislation, statutory provisions, and regulatory framework. Cite specific Acts, sections, and regulations.]

## Practical Guidance

[Provide step-by-step practical guidance for police station representatives. Include specific procedures, checklists, and best-practice tips.]

## Common Mistakes

[List common errors practitioners make in this area, with explanations of why they matter and how to avoid them.]

## Related Resources

- [Link to related Wiki article](/Wiki/related-slug)
- [Link to PACE guidance](/PACE)
- [Link to directory](/Directory)

## References

[^1]: [Source title], available at [URL from gov.uk / legislation.gov.uk / sra.org.uk]
[^2]: [Source title], available at [URL from gov.uk / legislation.gov.uk / sra.org.uk]
`;

  return {
    id: '',
    title,
    slug,
    category: '',
    content,
    excerpt: '',
    difficulty: 'Intermediate',
    tags: [],
    views: 0,
    helpfulCount: 0,
    wordCount: 0,
    factCheckStatus: 'pending',
    publishedDate: now,
    lastImprovedDate: null,
    sources: [],
    relatedArticles: [],
    sections: ['Legal Framework', 'Practical Guidance', 'Common Mistakes'],
    summary: '',
    verified: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Step 2 — validateSources                                          */
/* ------------------------------------------------------------------ */

/**
 * Parse footnote-style references from markdown content.
 * Handles both styles found in existing articles:
 *   [^N]: Title, available at https://...
 *   [N] Title — url
 */
export function parseSourcesFromContent(content: string): ArticleSource[] {
  const sources: ArticleSource[] = [];
  const seen = new Set<string>();

  // Style 1: [^N]: Title, available at URL
  const caret = /\[\^(\d+)\]:\s*(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = caret.exec(content)) !== null) {
    const line = m[2].trim();
    const urlMatch = line.match(/https?:\/\/[^\s)>\]]+/);
    const url = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : '';
    const title = line
      .replace(/https?:\/\/[^\s)>\]]+/, '')
      .replace(/,?\s*available at\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[—–-]+\s*$/, '')
      .trim();
    const key = url || title;
    if (key && !seen.has(key)) {
      seen.add(key);
      sources.push({ title: title || `Source ${m[1]}`, url });
    }
  }

  // Style 2: [N] Title — URL  (or Title -- URL, or just plain text)
  const bracket = /^\[(\d+)\]\s+(.+)/gm;
  while ((m = bracket.exec(content)) !== null) {
    const line = m[2].trim();
    const urlMatch = line.match(/https?:\/\/[^\s)>\]]+/);
    const url = urlMatch ? urlMatch[0].replace(/[.,;]+$/, '') : '';
    const title = line
      .replace(/https?:\/\/[^\s)>\]]+/, '')
      .replace(/[—–-]+\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const key = url || title;
    if (key && !seen.has(key)) {
      seen.add(key);
      sources.push({ title: title || `Source ${m[1]}`, url });
    }
  }

  return sources;
}

const APPROVED_TITLE_PATTERNS = [
  /legislation\.gov\.uk/i,
  /gov\.uk/i,
  /sra\.org\.uk/i,
  /lawcare\.org\.uk/i,
  /\bact\s+\d{4}\b/i,
  /\bregulations?\s+\d{4}\b/i,
  /\bpace\b/i,
  /\bsra\b/i,
  /\bcps\b/i,
  /\biopc\b/i,
  /\blegal aid agency\b/i,
  /\bstatutory guidance\b/i,
  /\bcode of conduct\b/i,
  /\bstandard crime contract\b/i,
  /\bhome office\b/i,
  /\bministry of justice\b/i,
];

function isApprovedSource(s: ArticleSource): boolean {
  if (s.url && isApprovedDomain(s.url)) return true;
  if (s.url && s.url.startsWith('/')) return true;
  const titleLower = (s.title || '').toLowerCase();
  return APPROVED_TITLE_PATTERNS.some((p) => p.test(titleLower));
}

export function validateSources(article: WikiArticle): SourceValidationResult {
  const issues: string[] = [];
  const parsed = parseSourcesFromContent(article.content);
  const allSources = [
    ...parsed,
    ...(article.sources ?? []).filter(
      (s) => !parsed.some((p) => p.url === s.url && p.title === s.title)
    ),
  ];

  if (allSources.length < 2) {
    issues.push(
      `Insufficient sources: found ${allSources.length}, minimum 2 required`
    );
  }

  const approvedCount = allSources.filter(isApprovedSource).length;

  if (approvedCount < 2) {
    issues.push(
      `Only ${approvedCount} approved source(s) found (gov.uk, sra.org.uk, legislation.gov.uk, lawcare.org.uk, or recognised legislation). Minimum 2 required.`
    );
  }

  for (const s of allSources) {
    if (s.url && !isApprovedDomain(s.url) && !s.url.startsWith('/')) {
      const titleApproved = APPROVED_TITLE_PATTERNS.some((p) =>
        p.test(s.title || '')
      );
      if (!titleApproved) {
        issues.push(`Source "${s.title}" uses unapproved domain: ${s.url}`);
      }
    }
    if (
      s.url &&
      (/example\.com/i.test(s.url) ||
        /placeholder/i.test(s.url) ||
        /test\.test/i.test(s.url))
    ) {
      issues.push(`Source "${s.title}" appears to be a placeholder: ${s.url}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    parsedSources: allSources,
  };
}

/* ------------------------------------------------------------------ */
/*  Step 3 — detectHallucination                                      */
/* ------------------------------------------------------------------ */

export function detectHallucination(
  article: WikiArticle
): HallucinationResult {
  const issues: string[] = [];
  const flaggedPhrases: string[] = [];
  const lowerContent = article.content.toLowerCase();

  for (const phrase of HEDGE_PHRASES) {
    if (lowerContent.includes(phrase)) {
      flaggedPhrases.push(phrase);
      issues.push(`Vague hedge phrase detected: "${phrase}"`);
    }
  }

  const actPattern =
    /(?:the\s+)?([A-Z][a-zA-Z\s,()]+Act\s+\d{4})/g;
  let actMatch: RegExpExecArray | null;
  while ((actMatch = actPattern.exec(article.content)) !== null) {
    const cited = actMatch[1].trim().toLowerCase();
    const isKnown = KNOWN_LEGISLATION.some(
      (leg) => cited.includes(leg) || leg.includes(cited)
    );
    if (!isKnown) {
      issues.push(
        `Unknown legislation cited: "${actMatch[1].trim()}" — verify this exists`
      );
      flaggedPhrases.push(actMatch[1].trim());
    }
  }

  const paragraphs = article.content.split(/\n{2,}/);
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const lowerPara = para.toLowerCase();

    const hasLegalClaim = LEGAL_CLAIM_INDICATORS.some((ind) =>
      lowerPara.includes(ind)
    );
    if (!hasLegalClaim) continue;

    const windowStart = Math.max(0, i - 1);
    const windowEnd = Math.min(paragraphs.length - 1, i + 1);
    const window = paragraphs
      .slice(windowStart, windowEnd + 1)
      .join('\n');

    const hasFootnote =
      /\[\^\d+\]/.test(window) ||
      /\[\d+\]/.test(window) ||
      /https?:\/\//.test(window);

    if (!hasFootnote) {
      const preview = para.slice(0, 120).replace(/\n/g, ' ');
      issues.push(
        `Unsupported legal claim without nearby citation: "${preview}..."`
      );
      flaggedPhrases.push(preview);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    flaggedPhrases,
  };
}

/* ------------------------------------------------------------------ */
/*  Step 4 — linkArticles                                              */
/* ------------------------------------------------------------------ */

export function linkArticles(
  article: WikiArticle,
  allArticles: WikiArticle[]
): WikiArticle {
  const articleTokens = tokenizeForMatching(
    [article.title, article.category, ...(article.tags ?? [])].join(' ')
  );

  const scored: { slug: string; score: number }[] = [];

  for (const other of allArticles) {
    if (other.slug === article.slug) continue;

    const otherTokens = tokenizeForMatching(
      [other.title, other.category, ...(other.tags ?? [])].join(' ')
    );

    let score = 0;

    if (other.category === article.category) score += 10;

    for (const token of articleTokens) {
      if (otherTokens.has(token)) score += 3;
    }

    const sharedTags = (article.tags ?? []).filter((t) =>
      (other.tags ?? []).some(
        (ot) => ot.toLowerCase() === t.toLowerCase()
      )
    );
    score += sharedTags.length * 5;

    if (score > 0) {
      scored.push({ slug: other.slug, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const slugSet = new Set(allArticles.map((a) => a.slug));
  const related = scored
    .slice(0, 5)
    .filter((s) => slugSet.has(s.slug))
    .map((s) => s.slug);

  if (related.length < 3) {
    const sameCat = allArticles.filter(
      (a) =>
        a.slug !== article.slug &&
        a.category === article.category &&
        !related.includes(a.slug)
    );
    for (const a of sameCat) {
      if (related.length >= 3) break;
      related.push(a.slug);
    }
  }

  return { ...article, relatedArticles: related.slice(0, 5) };
}

/* ------------------------------------------------------------------ */
/*  Step 5 — validateStructure                                         */
/* ------------------------------------------------------------------ */

export function validateStructure(article: WikiArticle): ValidationResult {
  const issues: string[] = [];

  if (!hasIntroBeforeFirstHeading(article.content)) {
    issues.push('Missing intro paragraph before first heading');
  }

  const headings = extractH2Headings(article.content);

  const hasSummarySection = headings.some((h) => {
    const lower = h.toLowerCase();
    return (
      lower.includes('key point') ||
      lower.includes('summary') ||
      lower.includes('overview') ||
      lower.includes('quick reference') ||
      lower.includes('introduction') ||
      lower.includes('key takeaway')
    );
  });
  if (!hasSummarySection) {
    issues.push(
      'No "Key Points", "Summary", or "Overview" section found (H2 level)'
    );
  }

  if (headings.length < 3) {
    issues.push(
      `Only ${headings.length} H2 section(s) found, minimum 3 required`
    );
  }

  const hasInternalLinks =
    (article.relatedArticles ?? []).length > 0 ||
    /\]\(\/(Wiki|Directory|PACE|Resources|LegalUpdates|StationsDirectory|Contact|GetWork|HowToBecome|FormsLibrary)/.test(
      article.content
    );
  if (!hasInternalLinks) {
    issues.push(
      'No related articles linked — add relatedArticles or internal links in content'
    );
  }

  const hasSources =
    (article.sources ?? []).length > 0 ||
    /\[\^\d+\]/.test(article.content) ||
    /^\[\d+\]\s/m.test(article.content);
  if (!hasSources) {
    issues.push('No sources found — add footnotes or populate sources array');
  }

  const excerpt = article.excerpt || article.summary || '';
  if (!excerpt.trim()) {
    issues.push('Missing excerpt / summary');
  }

  const wc = article.wordCount || countWords(article.content);
  if (wc < 500) {
    issues.push(`Word count too low: ${wc} (minimum 500)`);
  }

  return { valid: issues.length === 0, issues };
}

/* ------------------------------------------------------------------ */
/*  Step 6 — autoFixArticle                                            */
/* ------------------------------------------------------------------ */

export function autoFixArticle(
  article: WikiArticle,
  allArticles: WikiArticle[]
): AutoFixResult {
  const fixes: string[] = [];
  let fixed = { ...article };

  if (!fixed.sources || fixed.sources.length === 0) {
    const parsed = parseSourcesFromContent(fixed.content);
    if (parsed.length > 0) {
      fixed.sources = parsed;
      fixes.push(`Extracted ${parsed.length} source(s) from content footnotes`);
    }
  }

  if (!fixed.sections || fixed.sections.length === 0) {
    const headings = extractH2Headings(fixed.content);
    if (headings.length > 0) {
      fixed.sections = headings;
      fixes.push(`Extracted ${headings.length} section heading(s) from content`);
    }
  }

  if (!fixed.relatedArticles || fixed.relatedArticles.length === 0) {
    fixed = linkArticles(fixed, allArticles);
    if ((fixed.relatedArticles ?? []).length > 0) {
      fixes.push(
        `Linked ${fixed.relatedArticles!.length} related article(s)`
      );
    }
  }

  if (!fixed.summary && fixed.excerpt) {
    fixed.summary = fixed.excerpt;
    fixes.push('Copied excerpt to summary');
  }

  if (fixed.verified === undefined || fixed.verified === null) {
    fixed.verified = fixed.factCheckStatus === 'verified';
    fixes.push(`Set verified = ${fixed.verified}`);
  }

  if (!fixed.wordCount || fixed.wordCount === 0) {
    fixed.wordCount = countWords(fixed.content);
    fixes.push(`Computed wordCount = ${fixed.wordCount}`);
  }

  return { article: fixed, fixesApplied: fixes };
}

/* ------------------------------------------------------------------ */
/*  Step 7 — testArticle  (full pipeline)                              */
/* ------------------------------------------------------------------ */

export function testArticle(
  article: WikiArticle,
  allArticles: WikiArticle[]
): PipelineResult {
  const MAX_PASSES = 2;
  let current = { ...article };
  let allIssues: string[] = [];
  const allFixes: string[] = [];

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const issues: string[] = [];

    const srcResult = validateSources(current);
    issues.push(...srcResult.issues);

    const halResult = detectHallucination(current);
    issues.push(...halResult.issues);

    const structResult = validateStructure(current);
    issues.push(...structResult.issues);

    current = linkArticles(current, allArticles);

    if (issues.length === 0) {
      return {
        status: 'PASS',
        issues: [],
        fixesApplied: allFixes,
        article: current,
      };
    }

    if (pass < MAX_PASSES - 1) {
      const { article: fixed, fixesApplied } = autoFixArticle(
        current,
        allArticles
      );
      current = fixed;
      allFixes.push(...fixesApplied);
    }

    allIssues = issues;
  }

  return {
    status: allIssues.length > 0 ? 'FAIL' : 'PASS',
    issues: allIssues,
    fixesApplied: allFixes,
    article: current,
  };
}
