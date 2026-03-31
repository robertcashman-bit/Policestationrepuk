import Image from 'next/image';
import Link from 'next/link';
import { AdvertisementLabel } from './AdvertisementLabel';

export function HomeCustodyNote() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[var(--navy)] via-[#152e6e] to-[var(--navy)]" aria-label="Custody Note — promoted product">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.08),transparent_60%)]" />
      <div className="section-pad relative">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl text-center">
            <AdvertisementLabel variant="dark" label="Featured Product" />

            <h2 className="text-h2 mt-4 text-white">Custody Note</h2>
            <p className="mt-1 text-base font-medium text-[var(--gold)]">
              Police Station Attendance Note Software
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90">
              Desktop software built for criminal defence solicitors and accredited police station
              representatives. Structured PACE-aligned attendance notes, offline-first at the custody
              suite, PDF export, LAA billing support, and AES-256 encryption — all in one Windows app.
            </p>

            <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                { icon: '🔒', label: 'AES-256 Encrypted' },
                { icon: '📴', label: 'Works Offline' },
                { icon: '📄', label: 'PDF Export' },
              ].map((f) => (
                <div key={f.label} className="rounded-lg border border-white/15 bg-white/5 px-4 py-3">
                  <span className="text-lg" aria-hidden>{f.icon}</span>
                  <p className="mt-1 text-xs font-semibold text-white">{f.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border-2 border-[var(--gold)]/30 bg-[var(--gold)]/10 px-6 py-4">
              <p className="text-lg font-bold text-white">
                30-day free trial — then <span className="text-[var(--gold)]">£9.99/month</span> standard
              </p>
              <p className="mt-1 text-sm text-white/80">
                No credit card required · Windows 10+ · Cancel any time
              </p>
            </div>

            <div className="mt-6 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-black/25 px-5 py-2.5 text-sm font-semibold text-white">
              <span aria-hidden>🎁</span>
              Exclusive for PSR UK members — 25% off the £9.99/month subscription
            </div>

            <p className="mt-3 text-sm font-medium text-white">
              Use code{' '}
              <span className="rounded bg-[var(--navy-light)] px-2 py-0.5 font-mono font-bold text-white">
                A2MJY2NQ
              </span>{' '}
              at checkout on custodynote.com
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="https://custodynote.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full sm:w-auto"
              >
                Start Free Trial
              </Link>
              <Link
                href="/CustodyNote"
                className="btn-outline w-full !border-white/40 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto"
              >
                Learn more →
              </Link>
              <Link
                href="https://custodynote.com/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline w-full !border-white/40 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto"
              >
                View pricing →
              </Link>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <Image
                src="/images/custodynote/custodynote-features.png"
                alt="Custody Note features — PACE-aligned forms, offline mode, PDF export, encrypted backup"
                width={960}
                height={540}
                className="h-auto w-full"
              />
            </div>

            <p className="mt-5 text-xs text-white/60">
              Custody Note is developed by Defence Legal Services Ltd.
              This is a promoted product — not part of the directory service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
