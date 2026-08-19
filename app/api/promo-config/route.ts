import { NextResponse } from 'next/server';
import {
  CUSTODYNOTE_BETA_REASON,
  CUSTODYNOTE_DOWNLOAD_HREF,
  CUSTODYNOTE_FREE_LABEL,
  CUSTODYNOTE_NO_CARD_LINE,
  CUSTODYNOTE_PLANNED_PRO_LINE,
  CUSTODYNOTE_PRICE_GBP,
} from '@/lib/custodynote-promo';

export const dynamic = 'force-dynamic';

/** Public promo config for cross-site widgets (Custody Note offer surfaced on repuk). */
export async function GET() {
  return NextResponse.json({
    custodynote: {
      freeLabel: CUSTODYNOTE_FREE_LABEL,
      betaReason: CUSTODYNOTE_BETA_REASON,
      noCreditCard: CUSTODYNOTE_NO_CARD_LINE,
      downloadHref: CUSTODYNOTE_DOWNLOAD_HREF,
      /** Planned after beta only — not a live paid offer or discount code. */
      plannedProPriceGbp: CUSTODYNOTE_PRICE_GBP,
      plannedProNote: CUSTODYNOTE_PLANNED_PRO_LINE,
    },
    updatedAt: new Date().toISOString(),
  });
}
