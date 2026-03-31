import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'About the Founder — Robert Cashman | PoliceStationRepUK',
  description: 'Meet Robert Cashman — duty solicitor, higher rights advocate, and founder of PoliceStationRepUK. Learn about the vision behind the UK\u2019s free police station representative directory.',
  path: '/AboutFounder',
});

export default function AboutFounderPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'About the Founder' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Robert Cashman</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">Duty Solicitor | Higher Rights Advocate | Founder of PoliceStationRepUKDuty SolicitorQualified Duty Solicitor on the national rotaHigher Rights of AudienceQualified to advocate in Crown Court20+ Years ExperienceTwo decades in criminal defenceKent Bas</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10">

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Background &amp; Experience</h2>
            <p className="text-[var(--muted)] leading-relaxed">Robert Cashman is a Duty Solicitor with over 20 years of experience in criminal defence.</p>
            <p className="text-[var(--muted)] leading-relaxed">Based in Kent, he has represented thousands of clients at police stations across England and Wales, from straightforward interviews to complex serious crime matters.As a Duty Solicitor, Robert is part of the national duty solicitor scheme administered by the Legal Aid Agency, providing 24/7 advice to those detained by police who qualify for free legal assistance.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Higher Rights of Audience</h2>
            <p className="text-[var(--muted)] leading-relaxed">Qualified to advocate in Crown Court20+ Years ExperienceTwo decades in criminal defenceKent BasedServing Kent and surrounding countiesBackground &amp; ExperienceRobert Cashman is a Duty Solicitor with over 20 years of experience in criminal defence.</p>
            <p className="text-[var(--muted)] leading-relaxed">Based in Kent, he has represented thousands of clients at police stations across England and Wales, from straightforward interviews to complex serious crime matters.As a Duty Solicitor, Robert is part of the national duty solicitor scheme administered by the Legal Aid Agency, providing 24/7 advice to those detained by police who qualify for free legal assistance.Higher Rights of AudienceRobert holds Higher Rights of Audience (Criminal Proceedings), qualifying him to appear as an advocate in the Crown Court.</p>
            <p className="text-[var(--muted)] leading-relaxed">This advanced qualification demonstrates.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Mission: PoliceStationRepUK</h2>
            <p className="text-[var(--muted)] leading-relaxed">Robert founded PoliceStationRepUK with a clear mission: to connect criminal defence firms with qualified, accredited police station representatives across England and Wales.Having worked alongside many talented representatives throughout his career, Robert recognised the need for a centralised directory where firms could quickly find reliable cover for police station work, and where representatives could showcase their availability and expertise.&quot;Police station work is the foundation of criminal defence.</p>
            <p className="text-[var(--muted)] leading-relaxed">A good representative can make the difference between a fair outcome and an injustice.</p>
            <p className="text-[var(--muted)] leading-relaxed">This directory exists to ensure that every person detained by police has access to quality representation.&quot;— Robert Cashman.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Areas of Expertise</h2>
            <p className="text-[var(--muted)] leading-relaxed">Police station advice and representation under PACESerious crime including violence, drugs, and fraudCrown Court advocacy and higher court workLegal aid billing and complianceTraining and mentoring new representativesContact RobertView Rep Directory.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Join the Directory</h2>
            <p className="text-[var(--muted)] leading-relaxed">Are you an accredited police station representative? Register for free and connect with firms.Register for Free.</p>
          </section>

          <section>
            <h2 className="text-h2 text-[var(--navy)]">Police station solicitor services</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Robert&apos;s duty solicitor and police station agent work for firms and clients is separate from
              PoliceStationRepUK. For that service, visit{' '}
              <a
                href="https://www.policestationagent.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-hover)]"
              >
                policestationagent.com
              </a>
              .
            </p>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need Help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact Us
              </Link>
              <a
                href="https://www.policestationagent.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-white/15"
              >
                policestationagent.com
              </a>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
