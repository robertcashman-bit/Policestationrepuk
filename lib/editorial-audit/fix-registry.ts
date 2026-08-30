import fs from 'fs';
import path from 'path';
import type { AuditFinding } from './types';

export type FilePatch = { path: string; content: string; reason: string };

const FEE_REPLACEMENTS: Array<{ codePrefix: string; from: RegExp; to: string; reason: string }> = [
  {
    codePrefix: 'fee-181',
    from: /£181\b/g,
    to: '£320',
    reason: 'Replace superseded £181 with harmonised £320 (SI 2025/1251)',
  },
  {
    codePrefix: 'fee-219',
    from: /£219\b/g,
    to: '£320',
    reason: 'Replace superseded £219 with harmonised £320 (SI 2025/1251)',
  },
  {
    codePrefix: 'fee-rate-mismatch-181',
    from: /£181\b/g,
    to: '£320',
    reason: 'Replace superseded £181 with harmonised £320 (SI 2025/1251)',
  },
  {
    codePrefix: 'fee-rate-mismatch-219',
    from: /£219\b/g,
    to: '£320',
    reason: 'Replace superseded £219 with harmonised £320 (SI 2025/1251)',
  },
];

/**
 * Build safe mechanical patches from findings (fee figure swaps only).
 * Patches are included in the digest email / audit log; auto-PR is optional.
 */
export function collectSafeFixPatches(findings: AuditFinding[], root = process.cwd()): FilePatch[] {
  const patches: FilePatch[] = [];
  const seenPaths = new Set<string>();

  for (const finding of findings) {
    const rule = FEE_REPLACEMENTS.find(
      (r) => finding.code === r.codePrefix || finding.code.startsWith(r.codePrefix),
    );
    if (!rule) continue;
    const rel = finding.sourceFile;
    if (!rel || rel.includes('(missing)') || rel.includes('*') || seenPaths.has(rel)) continue;
    const full = path.join(root, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    let content = fs.readFileSync(full, 'utf8');
    if (!rule.from.test(content)) continue;
    rule.from.lastIndex = 0;
    content = content.replace(rule.from, rule.to);
    seenPaths.add(rel);
    patches.push({ path: rel, content, reason: `${rule.reason} (${finding.url})` });
  }

  return patches;
}

/** Markdown block for digest email / audit log. */
export function formatSafeFixPatchesForDigest(patches: FilePatch[]): string {
  if (patches.length === 0) return '';
  return (
    '<h3 style="margin:24px 0 8px;">Safe fix patches (optional)</h3>' +
    patches
      .map(
        (p) =>
          `<p style="margin:0 0 8px;font-size:13px;"><code>${escapeHtml(p.path)}</code> — ${escapeHtml(p.reason)}</p>`,
      )
      .join('')
  );
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Append a short run note + patches to the editorial audit log (non-fatal). */
export function appendAuditRunLog(opts: {
  date: string;
  findingCount: number;
  patches: FilePatch[];
  prUrl?: string;
  prError?: string;
}): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;
  try {
    const logPath = path.join(process.cwd(), 'audit', 'editorial-audit-runs.md');
    const lines = [
      '',
      `## ${opts.date}`,
      '',
      `- Findings: ${opts.findingCount}`,
      ...(opts.patches.length
        ? opts.patches.map((p) => `- Safe patch: \`${p.path}\` — ${p.reason}`)
        : ['- Safe patches: none']),
      opts.prUrl ? `- Auto-PR: ${opts.prUrl}` : null,
      opts.prError ? `- Auto-PR skipped/failed: ${opts.prError}` : null,
      '',
    ].filter((l) => l !== null) as string[];

    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, lines.join('\n'), 'utf8');
  } catch (err) {
    console.warn('[editorial-audit] could not append audit run log', err);
  }
}
