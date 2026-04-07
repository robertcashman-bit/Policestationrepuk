import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { PillarSeoLayout } from '@/components/PillarSeoLayout';

export const metadata = buildMetadata({
  title: 'Police Station Representative UK — Role & Guide',
  description:
    'What a police station representative is, PACE custody work with solicitors, and how firms find accredited reps across England and Wales.',
  path: '/police-station-representative',
});

const BC = [
  { name: 'Home', url: '/' },
  { name: 'Police station representative', url: '/police-station-representative' },
];

const FAQS = [
  {
    q: 'Is a police station representative a solicitor?',
    a: 'Not always. Many reps are accredited representatives who attend under the supervision of a solicitor firm. Some solicitors also attend custody themselves. The key is proper accreditation and firm responsibility for the retainer.',
  },
  {
    q: 'What accreditation is required?',
    a: 'Requirements depend on the scheme (e.g. Law Society police station accreditation). Firms must ensure anyone attending meets the standards that apply to their practice and to legal aid where relevant.',
  },
  {
    q: 'How do firms find a rep?',
    a: 'They use directories like PoliceStationRepUK, internal panels, WhatsApp networks, and call-centre arrangements. The directory is free to search and lists profiles by area and station.',
  },
];

export default function PoliceStationRepresentativePage() {
  return (
    <PillarSeoLayout
      title="Police station representative in the UK"
      breadcrumbItems={BC}
      quickAnswer="A police station representative is an accredited professional who attends custody on behalf of a criminal defence solicitor firm to advise clients, support interviews, and safeguard PACE rights. PoliceStationRepUK is a free directory that helps firms find such representatives across England and Wales."
      faqs={FAQS}
    >
      <h2 className="text-xl font-bold text-[var(--navy)]">Definition</h2>
      <p>
        A <strong className="text-[var(--navy)]">police station representative</strong> (sometimes called a police
        station agent or rep) is someone who attends a police station to deliver legal advice and assistance to a
        suspect or volunteer, under the instruction of a solicitor firm. The representative is part of the firm&apos;s
        operational model for <strong className="text-[var(--navy)]">police station representation</strong> — not a
        replacement for the firm&apos;s professional accountability.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">What they do in custody</h2>
      <p>Typical tasks include:</p>
      <ul className="list-inside list-disc space-y-2 pl-1">
        <li>Taking instructions and explaining the allegation and process in plain language.</li>
        <li>Advising on the right to legal advice, silence, and the caution (where appropriate).</li>
        <li>Reviewing disclosure (within what the police provide at that stage).</li>
        <li>Being present in the interview to intervene on fairness and legal issues.</li>
        <li>Liaising with the officer in the case and updating the instructing solicitor.</li>
      </ul>
      <h2 className="text-xl font-bold text-[var(--navy)]">Relationship to criminal solicitors</h2>
      <p>
        Criminal solicitors and duty solicitor firms use reps to extend{' '}
        <Link href="/criminal-solicitor-police-station" className="font-semibold text-[var(--navy)] underline">
          police station cover
        </Link>{' '}
        when in-house lawyers are in court, on other arrests, or off rota. The directory exists to make that matching
        faster, especially for urgent and out-of-hours work.
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">PACE and professional standards</h2>
      <p>
        Attendance is governed by the Police and Criminal Evidence Act 1984 (PACE) and the Codes of Practice. Reps must
        work within the framework set by the instructing firm and applicable regulators. For introductory reading, see
        our{' '}
        <Link href="/PACE" className="font-semibold text-[var(--navy)] underline">
          PACE overview
        </Link>{' '}
        and{' '}
        <Link href="/police-station-rights-uk" className="font-semibold text-[var(--navy)] underline">
          police station rights
        </Link>{' '}
        guide (general information only).
      </p>
      <h2 className="text-xl font-bold text-[var(--navy)]">How PoliceStationRepUK helps</h2>
      <p>
        We do not provide legal advice. We publish profiles of accredited representatives and search tools so{' '}
        <Link href="/directory" className="font-semibold text-[var(--navy)] underline">
          criminal law firms
        </Link>{' '}
        can filter by county, station, and accreditation. Registration for reps is free. If you are a firm, start with
        the directory and{' '}
        <Link href="/search" className="font-semibold text-[var(--navy)] underline">
          advanced search
        </Link>
        .
      </p>
      <p>
        Compare roles:{' '}
        <Link href="/DutySolicitorVsRep" className="font-semibold text-[var(--navy)] underline">
          Duty solicitor vs police station rep
        </Link>
        .
      </p>
    </PillarSeoLayout>
  );
}
