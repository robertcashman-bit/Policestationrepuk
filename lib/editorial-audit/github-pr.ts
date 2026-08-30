import { getAuditConfig } from './config';
import type { FilePatch } from './fix-registry';

async function ghFetch(apiPath: string, init: RequestInit & { token: string }) {
  const res = await fetch(`https://api.github.com${apiPath}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${init.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${apiPath}: ${res.status} ${body}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Optional auto-PR for safe patches. Callers MUST catch failures (e.g. 403
 * when the token is not a collaborator) — never fail the audit run.
 */
export async function openAuditPullRequest(
  patches: FilePatch[],
): Promise<{ url?: string; error?: string }> {
  const cfg = getAuditConfig();
  if (!cfg.githubToken || patches.length === 0) {
    return { error: cfg.githubToken ? undefined : 'GITHUB_TOKEN not set' };
  }

  try {
    const [owner, repo] = cfg.githubRepo.split('/');
    if (!owner || !repo) return { error: `Invalid GITHUB_REPO: ${cfg.githubRepo}` };

    const date = new Date().toISOString().slice(0, 10);
    const branch = `audit/fixes-${date}`;
    const token = cfg.githubToken;

    const mainRef = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/master`, { token });
    const object = mainRef.object as { sha?: string } | undefined;
    const baseSha = object?.sha;
    if (!baseSha) return { error: 'Could not resolve master SHA' };

    try {
      await ghFetch(`/repos/${owner}/${repo}/git/refs`, {
        token,
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('422')) throw e;
    }

    for (const patch of patches) {
      let fileSha: string | undefined;
      try {
        const existing = await ghFetch(
          `/repos/${owner}/${repo}/contents/${patch.path}?ref=${branch}`,
          { token },
        );
        fileSha = existing.sha as string | undefined;
      } catch {
        /* new file */
      }

      await ghFetch(`/repos/${owner}/${repo}/contents/${patch.path}`, {
        token,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[audit] ${patch.reason}`,
          content: Buffer.from(patch.content, 'utf8').toString('base64'),
          branch,
          ...(fileSha ? { sha: fileSha } : {}),
        }),
      });
    }

    const pr = await ghFetch(`/repos/${owner}/${repo}/pulls`, {
      token,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[audit] Editorial fixes — ${date}`,
        head: branch,
        base: 'master',
        body: patches.map((p) => `- **${p.path}**: ${p.reason}`).join('\n'),
      }),
    });

    return { url: pr.html_url as string | undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('[editorial-audit] auto-PR failed (non-fatal):', msg);
    return { error: msg };
  }
}
