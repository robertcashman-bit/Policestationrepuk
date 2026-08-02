export const OUTREACH_KICK_PATH_PATTERN =
  /^(lib\/firm-outreach|app\/api\/cron\/firm-outreach|packages\/firm-outreach-core|scripts\/firm-outreach|\.github\/workflows\/firm-outreach-kick\.yml)/;

export interface KickAuth {
  header: string;
  value: string;
}

export function resolveKickAuth(env: {
  CRON_SECRET?: string;
  FIRM_OUTREACH_BOOTSTRAP_SECRET?: string;
}): KickAuth | null {
  const cron = env.CRON_SECRET?.trim();
  if (cron) return { header: 'Authorization', value: `Bearer ${cron}` };
  const bootstrap = env.FIRM_OUTREACH_BOOTSTRAP_SECRET?.trim();
  if (bootstrap) return { header: 'x-firm-outreach-bootstrap-secret', value: bootstrap };
  return null;
}

export function outreachPathsChanged(changedPaths: string[]): boolean {
  return changedPaths.some((p) => OUTREACH_KICK_PATH_PATTERN.test(p));
}

export interface KickStep {
  path: string;
  label: string;
  /** When true, non-200 responses are logged but do not fail the kick. */
  optional?: boolean;
}

export interface KickStepResult {
  path: string;
  label: string;
  status: number;
  body: string;
  ok: boolean;
  optional: boolean;
}

export async function runProductionKickSteps(opts: {
  baseUrl: string;
  auth: KickAuth;
  steps: KickStep[];
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ results: KickStepResult[]; failed: boolean }> {
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 320_000;
  const results: KickStepResult[] = [];

  for (const step of opts.steps) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status = 0;
    let body = '';
    try {
      const res = await fetchFn(`${opts.baseUrl.replace(/\/$/, '')}${step.path}`, {
        headers: { [opts.auth.header]: opts.auth.value },
        signal: controller.signal,
      });
      status = res.status;
      body = await res.text();
    } catch (err) {
      body = err instanceof Error ? err.message : String(err);
      status = 0;
    } finally {
      clearTimeout(timer);
    }

    const ok = status === 200;
    const optional = step.optional ?? false;
    results.push({ path: step.path, label: step.label, status, body, ok, optional });
    if (!ok && !optional) {
      return { results, failed: true };
    }
  }

  return { results, failed: false };
}

export const DEFAULT_PRODUCTION_KICK_STEPS: KickStep[] = [
  {
    path: '/api/cron/firm-outreach-status',
    label: 'Outreach send health (status)',
    optional: true,
  },
  // Heal Buffer day quota (e.g. morning cron left 1/5) before long outreach work.
  {
    path: '/api/cron/buffer-verify',
    label: 'Buffer verify + gap-fill today',
    optional: true,
  },
  // Reconcile delivery events missed while the Resend webhook was failing/disabled.
  // Optional: Resend emails.get fan-out can exceed function timeout; kick must not fail.
  {
    path: '/api/cron/firm-outreach-backfill-delivery?limit=15',
    label: 'Backfill delivery status from Resend',
    optional: true,
  },
  // Operator-only Resend probes for both websites (fails kick if either path cannot send).
  {
    path: '/api/cron/firm-outreach-probe',
    label: 'Pre-flight email probes (policestationrepuk + policestationagent)',
  },
  // Flush FIRST while cooldown override is live — do not let requalify/enrich burn the window.
  {
    path: '/api/cron/firm-outreach-bootstrap?dryRunPreview=1&allCampaigns=1&limit=150',
    label: 'Dry-run preview (both campaigns, safe send limit)',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-send?limit=150',
    label: 'Send flush 1 (whatsapp_invite_v1 + agent_cover_kent_v1)',
  },
  // Immediate second pass while Resend quota remains — large ready queues (200+)
  // often leave capacity after flush 1 finishes early on skips/suppressions.
  {
    path: '/api/cron/firm-outreach-send?limit=150',
    label: 'Send flush 1b (drain remaining quota)',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-bootstrap?requalifyOnly=1',
    label: 'Requalify ready_to_send junk rows',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-bootstrap?cleanupBadEmails=1&dryRun=0&allStatuses=1',
    label: 'Cleanup non-firm / bad emails (both campaigns)',
    optional: true,
  },
  // Grow never-contacted inventory after the first flush.
  {
    path: '/api/cron/firm-outreach-discovery',
    label: 'Discovery (new firm prospects)',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-pipeline/maintain',
    label: 'Pipeline maintain (requalify + inventory)',
    optional: true,
  },
  // PSA: seed Kent + larger enrich so agent_cover gains ready firm inboxes.
  {
    path: '/api/cron/firm-outreach-bootstrap?seedAgentCover=1&campaignId=agent_cover_kent_v1&batches=3&limit=80',
    label: 'Seed + enrich PSA agent-cover Kent',
    optional: true,
  },
  // RepUK: larger enrich batches to surface firm-type emails before flush.
  {
    path: '/api/cron/firm-outreach-bootstrap?batches=1&limit=80',
    label: 'Enrich batch 1 (RepUK bootstrap)',
  },
  {
    path: '/api/cron/firm-outreach-bootstrap?batches=1&limit=80',
    label: 'Enrich batch 2 (RepUK bootstrap)',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-bootstrap?batches=1&limit=80',
    label: 'Enrich batch 3 (RepUK bootstrap)',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-bootstrap?batches=1&limit=80',
    label: 'Enrich batch 4 (RepUK bootstrap)',
    optional: true,
  },
  // Second flush catches anything enrich just promoted into ready_to_send.
  {
    path: '/api/cron/firm-outreach-send?limit=150',
    label: 'Send flush 2 (remaining safe capacity)',
  },
];

export interface VercelDeployment {
  id?: string;
  uid?: string;
  url?: string;
  readyState?: string;
  createdAt?: number;
  meta?: { githubCommitSha?: string };
}

export async function waitForVercelProductionDeploy(opts: {
  token: string;
  projectId: string;
  teamId?: string;
  commitSha?: string;
  timeoutMs?: number;
  pollMs?: number;
  fetchFn?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{ ready: boolean; deployment?: VercelDeployment }> {
  const fetchFn = opts.fetchFn ?? fetch;
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const deadline = now() + (opts.timeoutMs ?? 600_000);
  const pollMs = opts.pollMs ?? 15_000;

  while (now() < deadline) {
    const params = new URLSearchParams({
      projectId: opts.projectId,
      limit: '10',
      target: 'production',
    });
    if (opts.teamId) params.set('teamId', opts.teamId);

    const res = await fetchFn(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { deployments?: VercelDeployment[] };
      const deployments = data.deployments ?? [];
      const sorted = deployments
        .slice()
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      if (opts.commitSha) {
        const shaDeployments = sorted.filter((d) => d.meta?.githubCommitSha === opts.commitSha);
        const latest = shaDeployments[0];
        if (latest?.readyState === 'READY') return { ready: true, deployment: latest };
        if (shaDeployments.length === 0) {
          const anyReady = sorted.find((d) => d.readyState === 'READY');
          if (anyReady) return { ready: true, deployment: anyReady };
        }
      } else {
        const anyReady = sorted.find((d) => d.readyState === 'READY');
        if (anyReady) return { ready: true, deployment: anyReady };
      }
    }
    await sleep(pollMs);
  }

  return { ready: false };
}
