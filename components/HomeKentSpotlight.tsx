import {
  CONTACT_PHONE_TEL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_SMS_TEL,
  CONTACT_SMS_DISPLAY,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/contact-constants';

export function HomeKentSpotlight() {
  return (
    <section className="section-pad bg-[var(--gold-pale)]" aria-labelledby="kent-agency-heading">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="kent-agency-heading" className="text-h3 mt-0 text-[var(--navy)]">
            Kent police station rep agency
          </h2>
          <p className="mt-2 text-sm font-medium text-[var(--navy)]/85">
            Duty solicitor cover • 24/7 • All Kent stations — use the number and WhatsApp below only for this Kent agency
            service.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={CONTACT_PHONE_TEL} className="btn-gold !text-sm">
              📞 {CONTACT_PHONE_DISPLAY}
            </a>
            <a
              href={CONTACT_WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline !text-sm"
            >
              WhatsApp
            </a>
            <a href={CONTACT_SMS_TEL} className="btn-outline !text-sm">
              💬 SMS {CONTACT_SMS_DISPLAY}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
