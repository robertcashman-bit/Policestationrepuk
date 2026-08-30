/**
 * Optional GitHub PR helper kept for manual/operator use.
 * The editorial audit runner does NOT call this — auto-PR create is disabled
 * (token often lacks collaborator access; GPT fixes are digest metadata only).
 */
export async function openAuditPullRequest(): Promise<{ url?: string; error?: string }> {
  return {
    error: 'Auto-PR disabled — suggested fixes are emailed as metadata only',
  };
}
