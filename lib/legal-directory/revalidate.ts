/**
 * Bust Next.js ISR caches for Legal Services Directory public pages after
 * listing writes. Safe no-op outside a Next request (scripts / vitest).
 */

import { LEGAL_DIRECTORY_BASE } from './constants';

export async function revalidateLegalDirectoryPaths(): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache');
    revalidatePath(LEGAL_DIRECTORY_BASE);
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/search`);
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/categories`);
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/locations`);
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/category`, 'layout');
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/location`, 'layout');
    revalidatePath(`${LEGAL_DIRECTORY_BASE}/listing`, 'layout');
  } catch {
    /* script / test context */
  }
}
