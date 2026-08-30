import { getKV } from '@/lib/kv';

const LLM_STATE_KEY = 'editorial-audit:llm-state';

export type LlmSpendState = {
  llm_calls_this_month: number;
  llm_month_key: string;
  estimated_spend_usd: number;
};

function monthKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

let memoryState: LlmSpendState = {
  llm_calls_this_month: 0,
  llm_month_key: monthKey(),
  estimated_spend_usd: 0,
};

function resetIfNewMonth(state: LlmSpendState): LlmSpendState {
  const key = monthKey();
  if (state.llm_month_key === key) return state;
  return { llm_calls_this_month: 0, llm_month_key: key, estimated_spend_usd: 0 };
}

export async function loadLlmSpendState(): Promise<LlmSpendState> {
  const kv = getKV();
  if (!kv) return resetIfNewMonth({ ...memoryState });
  const stored = await kv.get<LlmSpendState>(LLM_STATE_KEY);
  if (!stored) return resetIfNewMonth({ ...memoryState, llm_month_key: monthKey() });
  return resetIfNewMonth(stored);
}

export async function saveLlmSpendState(state: LlmSpendState): Promise<void> {
  const next = { ...state, llm_month_key: monthKey() };
  memoryState = next;
  const kv = getKV();
  if (kv) {
    await kv.set(LLM_STATE_KEY, next, { ex: 60 * 60 * 24 * 40 });
  }
}

/** Test helper */
export function resetLlmSpendStateForTests(): void {
  memoryState = {
    llm_calls_this_month: 0,
    llm_month_key: monthKey(),
    estimated_spend_usd: 0,
  };
}
