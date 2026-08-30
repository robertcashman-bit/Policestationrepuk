function intEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function floatEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  const n = parseFloat(raw ?? '');
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function clean(name: string): string {
  return process.env[name]?.trim() ?? '';
}

export function getAuditConfig() {
  const llmOn = clean('AUDIT_LLM_ON')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    emailTo:
      clean('AUDIT_EMAIL_TO') ||
      clean('EDITORIAL_AUDIT_NOTIFY_EMAIL') ||
      clean('CUSTODY_DISCOVERY_NOTIFY_EMAIL') ||
      clean('OWNER_EMAIL') ||
      clean('ADMIN_EMAILS').split(/[,;]/)[0]?.trim() ||
      'robertdavidcashman@gmail.com',
    batchSize: intEnv('EDITORIAL_AUDIT_BATCH_SIZE', intEnv('AUDIT_BATCH_SIZE', 20)),
    llmMaxCallsPerRun: intEnv('AUDIT_LLM_MAX_CALLS', 2),
    llmMonthlyCallCap: intEnv('AUDIT_LLM_MONTHLY_CALL_CAP', 60),
    llmModel: clean('AUDIT_LLM_MODEL') || 'gpt-4o-mini',
    llmMode: clean('AUDIT_LLM_MODE') || 'rules_flagged_only',
    llmOnKinds: new Set(
      llmOn.length ? llmOn : ['guide', 'fee-rights', 'blog', 'wiki', 'legal-update'],
    ),
    llmMaxInputChars: intEnv('AUDIT_LLM_MAX_INPUT_CHARS', 6000),
    llmMaxOutputTokens: intEnv('AUDIT_LLM_MAX_OUTPUT_TOKENS', 512),
    openAiSoftCapUsd: floatEnv('AUDIT_OPENAI_SOFT_CAP_USD', 3),
    githubRepo: clean('GITHUB_REPO') || 'robertcashman-bit/Policestationrepuk',
    githubToken: clean('GITHUB_TOKEN'),
    siteUrl: clean('NEXT_PUBLIC_SITE_URL') || 'https://policestationrepuk.org',
  };
}

/** gpt-4o-mini approximate pricing for soft-cap tracking. */
export function estimateLlmCostUsd(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * 0.15 + (outputTokens / 1_000_000) * 0.6;
}
