import OpenAI from 'openai';
import { estimateLlmCostUsd, getAuditConfig } from './config';
import { proposedFixForCode } from './fixes';
import type { AuditFinding, AuditUnit } from './types';

export type LlmCheckResult = {
  findings: AuditFinding[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

function llmKindAllowed(unit: AuditUnit): boolean {
  const cfg = getAuditConfig();
  return cfg.llmOnKinds.has(unit.contentType);
}

export function shouldRunLlm(
  unit: AuditUnit,
  ruleFindings: AuditFinding[],
  callsThisRun: number,
  state: { llm_calls_this_month: number; estimated_spend_usd: number },
): boolean {
  const cfg = getAuditConfig();
  if (!process.env.OPENAI_API_KEY?.trim()) return false;
  if (!unit.llmEligible || !llmKindAllowed(unit)) return false;
  if (!unit.text?.trim()) return false;
  if (callsThisRun >= cfg.llmMaxCallsPerRun) return false;
  if (state.llm_calls_this_month >= cfg.llmMonthlyCallCap) return false;
  if (state.estimated_spend_usd >= cfg.openAiSoftCapUsd) return false;
  if (cfg.llmMode === 'rules_flagged_only' && ruleFindings.length === 0) return false;
  return true;
}

export async function runLlmFactCheck(unit: AuditUnit): Promise<LlmCheckResult> {
  const cfg = getAuditConfig();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const text = (unit.text ?? '').slice(0, cfg.llmMaxInputChars);

  const completion = await openai.chat.completions.create({
    model: cfg.llmModel,
    max_tokens: cfg.llmMaxOutputTokens,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You audit UK police-station representative directory / PACE / LAA fee / custody-rights copy for factual accuracy on PoliceStationRepUK. Return JSON: {"verdict":"PASS"|"REVIEW"|"FAIL","issues":[{"claim":"...","reason":"...","suggested_fix":"..."}]}. Never invent sources. If unsure, use REVIEW.',
      },
      {
        role: 'user',
        content: `Content type: ${unit.contentType}\nURL: ${unit.url}\nSection: ${unit.sectionTitle}\n\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const findings: AuditFinding[] = [];

  try {
    const parsed = JSON.parse(raw) as {
      verdict?: string;
      issues?: { claim?: string; reason?: string; suggested_fix?: string }[];
    };
    const issues = parsed.issues ?? [];
    for (const issue of issues) {
      const reason = [issue.claim, issue.reason].filter(Boolean).join(' — ');
      const severity: AuditFinding['severity'] =
        parsed.verdict === 'FAIL' ? 'PROBLEM' : 'REVIEW';
      findings.push({
        fingerprint: `${unit.id}:llm-fact-check:${findings.length}`,
        unitId: unit.id,
        url: unit.url,
        sectionTitle: unit.sectionTitle,
        sourceFile: unit.sourceFile,
        severity,
        code: 'llm-fact-check',
        reason: reason || `LLM verdict: ${parsed.verdict ?? 'REVIEW'}`,
        proposedFix: issue.suggested_fix?.trim() || proposedFixForCode('llm-fact-check'),
        excerpt: issue.claim,
      });
    }
    if (issues.length === 0 && parsed.verdict && parsed.verdict !== 'PASS') {
      findings.push({
        fingerprint: `${unit.id}:llm-fact-check`,
        unitId: unit.id,
        url: unit.url,
        sectionTitle: unit.sectionTitle,
        sourceFile: unit.sourceFile,
        severity: parsed.verdict === 'FAIL' ? 'PROBLEM' : 'REVIEW',
        code: 'llm-fact-check',
        reason: `LLM verdict: ${parsed.verdict}`,
        proposedFix: proposedFixForCode('llm-fact-check'),
      });
    }
  } catch {
    findings.push({
      fingerprint: `${unit.id}:llm-unparseable`,
      unitId: unit.id,
      url: unit.url,
      sectionTitle: unit.sectionTitle,
      sourceFile: unit.sourceFile,
      severity: 'REVIEW',
      code: 'llm-unparseable',
      reason: 'LLM returned unparseable response',
      proposedFix: proposedFixForCode('llm-unparseable'),
    });
  }

  return {
    findings,
    inputTokens,
    outputTokens,
    costUsd: estimateLlmCostUsd(inputTokens, outputTokens),
  };
}
