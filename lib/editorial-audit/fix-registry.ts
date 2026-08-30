import type { AuditFinding } from './types';

/**
 * Digest helpers for safe-fix *suggestions* only.
 * Do not rewrite source files or open GitHub PRs from the audit runner.
 */

/** HTML block listing proposed / LLM suggested fixes for the findings-only digest. */
export function formatSuggestedFixesForDigest(findings: AuditFinding[]): string {
  const withFix = findings.filter((f) => f.proposedFix?.trim());
  if (withFix.length === 0) return '';

  const rows = withFix
    .slice(0, 15)
    .map((f) => {
      const claim = f.excerpt ? ` <em>("${escapeHtml(f.excerpt.slice(0, 80))}")</em>` : '';
      return `<li style="margin:0 0 8px;font-size:13px;line-height:1.45;">
        <code>${escapeHtml(f.code)}</code> on
        <a href="${escapeHtml(f.url)}">${escapeHtml(f.url)}</a>${claim}<br/>
        <strong>Suggested fix:</strong> ${escapeHtml(f.proposedFix)}
      </li>`;
    })
    .join('');

  return `<h3 style="margin:24px 0 8px;">Suggested fixes (manual review — not auto-applied)</h3>
    <ul style="margin:0;padding-left:18px;">${rows}</ul>`;
}

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Append a short run note to the editorial audit log (non-fatal; skipped in tests). */
export function appendAuditRunLog(opts: {
  date: string;
  findingCount: number;
  suggestedFixCount: number;
}): void {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const logPath = path.join(process.cwd(), 'audit', 'editorial-audit-runs.md');
    const lines = [
      '',
      `## ${opts.date}`,
      '',
      `- Findings: ${opts.findingCount}`,
      `- Suggested fixes (metadata only): ${opts.suggestedFixCount}`,
      `- Auto-edit / auto-PR: disabled`,
      '',
    ];
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, lines.join('\n'), 'utf8');
  } catch (err) {
    console.warn('[editorial-audit] could not append audit run log', err);
  }
}
