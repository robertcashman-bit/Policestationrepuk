import { permanentRedirect } from 'next/navigation';

/** Legacy URL — the community uses a single WhatsApp group; see /WhatsApp */
export default function FirmsWhatsAppGroupRedirect() {
  permanentRedirect('/WhatsApp');
}
