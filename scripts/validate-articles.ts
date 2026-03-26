#!/usr/bin/env npx tsx
/**
 * CLI runner for the article content pipeline.
 *
 * Usage:
 *   npx tsx scripts/validate-articles.ts          # validate only
 *   npx tsx scripts/validate-articles.ts --fix     # validate + write enriched JSON back
 *   npx tsx scripts/validate-articles.ts --slug police-caution-explained   # single article
 */

import fs from 'fs';
import path from 'path';
import { testArticle } from '../lib/article-pipeline';
import type { WikiArticle } from '../lib/types';
import type { PipelineResult } from '../lib/article-pipeline';

const DATA_PATH = path.resolve(__dirname, '..', 'data', 'wiki-articles.json');

function loadArticles(): WikiArticle[] {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as WikiArticle[];
}

function writeArticles(articles: WikiArticle[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(articles, null, 2) + '\n', 'utf-8');
}

/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const doFix = args.includes('--fix');
const slugFlag = args.indexOf('--slug');
const targetSlug = slugFlag !== -1 ? args[slugFlag + 1] : null;

const articles = loadArticles();

if (targetSlug) {
  const found = articles.find((a) => a.slug === targetSlug);
  if (!found) {
    console.error(`Article with slug "${targetSlug}" not found.`);
    process.exit(1);
  }
}

console.log(`\nArticle Content Pipeline — ${articles.length} article(s) loaded`);
console.log(`Mode: ${doFix ? 'VALIDATE + FIX' : 'VALIDATE ONLY'}`);
if (targetSlug) console.log(`Target: ${targetSlug}`);
console.log('─'.repeat(80));

const results: { slug: string; title: string; result: PipelineResult }[] = [];
let passCount = 0;
let failCount = 0;

const toProcess = targetSlug
  ? articles.filter((a) => a.slug === targetSlug)
  : articles;

for (const article of toProcess) {
  const result = testArticle(article, articles);
  results.push({ slug: article.slug, title: article.title, result });
  if (result.status === 'PASS') passCount++;
  else failCount++;
}

console.log('');
console.log(
  padRight('SLUG', 45) +
    padRight('STATUS', 10) +
    padRight('ISSUES', 10) +
    padRight('FIXES', 10)
);
console.log('─'.repeat(75));

for (const { slug, result } of results) {
  const status = result.status === 'PASS' ? '  PASS' : '* FAIL';
  console.log(
    padRight(slug, 45) +
      padRight(status, 10) +
      padRight(String(result.issues.length), 10) +
      padRight(String(result.fixesApplied.length), 10)
  );
}

console.log('─'.repeat(75));
console.log(`Total: ${passCount} PASS, ${failCount} FAIL out of ${toProcess.length}`);
console.log('');

for (const { slug, title, result } of results) {
  if (result.issues.length === 0 && result.fixesApplied.length === 0) continue;

  console.log(`── ${slug} (${title})`);
  if (result.fixesApplied.length > 0) {
    console.log('   Fixes applied:');
    for (const fix of result.fixesApplied) {
      console.log(`     ✓ ${fix}`);
    }
  }
  if (result.issues.length > 0) {
    console.log('   Remaining issues:');
    for (const issue of result.issues) {
      console.log(`     ✗ ${issue}`);
    }
  }
  console.log('');
}

if (doFix) {
  const enrichedMap = new Map(results.map((r) => [r.slug, r.result.article]));
  const updatedArticles = articles.map((a) => enrichedMap.get(a.slug) ?? a);
  writeArticles(updatedArticles);
  console.log(`Enriched articles written to ${DATA_PATH}`);
}

if (failCount > 0) {
  process.exit(1);
}

/* ------------------------------------------------------------------ */

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}
