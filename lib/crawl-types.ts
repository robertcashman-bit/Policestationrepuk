/**
 * Types for crawled page content (content/crawl/*.json).
 * Use when reading crawl output to generate static pages.
 */

export interface CrawlPage {
  url: string;
  path: string;
  title: string;
  headings: { level: number; text: string }[];
  content: string;
  links: { href: string; text: string }[];
  crawledAt: string;
  error?: string;
}

export interface CrawlManifest {
  baseUrl: string;
  crawledAt: string;
  count: number;
  pages: { path: string; file: string }[];
}
