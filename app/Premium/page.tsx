import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Training Guides & Resources — Free Articles for Reps',
  description:
    'Browse 45+ free training articles and guides for police station representatives — professional development, PACE, billing, and more.',
  path: '/Premium',
});

type Article = { title: string; level: 'Beginner' | 'Intermediate' | 'Advanced' };

const CATEGORIES: { name: string; articles: Article[] }[] = [
  {
    name: 'Professional Development',
    articles: [
      { title: 'The Leveson Review Impact', level: 'Advanced' },
      { title: 'Leveson Criminal Courts Review', level: 'Advanced' },
      { title: 'Professional Development for Reps', level: 'Intermediate' },
      { title: 'CPD/Specialization/Career Growth', level: 'Intermediate' },
      { title: 'Getting a Training Contract After PSRAS', level: 'Intermediate' },
      { title: 'Building Your Career', level: 'Beginner' },
      { title: 'Building Your Rep Business', level: 'Intermediate' },
      { title: 'Station Intelligence', level: 'Advanced' },
    ],
  },
  {
    name: 'Dealing with Police',
    articles: [
      { title: 'Seized Property Guide', level: 'Intermediate' },
      { title: 'Police Warrants', level: 'Intermediate' },
      { title: 'Police Complaint System', level: 'Beginner' },
      { title: 'Professional Relationships', level: 'Beginner' },
      { title: 'Rights/Powers/Practical Strategies', level: 'Advanced' },
    ],
  },
  {
    name: 'Client Management',
    articles: [
      { title: 'Client Care Complete Guide', level: 'Beginner' },
      { title: 'Legal Aid Claiming & Billing Guide', level: 'Intermediate' },
      { title: 'PDI CPD/Specialization', level: 'Advanced' },
    ],
  },
  {
    name: 'Claiming & Billing',
    articles: [
      { title: 'Maximizing Legal Aid Claims', level: 'Intermediate' },
      { title: 'Understanding Double Fees', level: 'Intermediate' },
      { title: 'Mileage Claims', level: 'Beginner' },
      { title: 'Escape Fee Guide', level: 'Advanced' },
    ],
  },
  {
    name: 'Common Problems',
    articles: [
      { title: 'Common Problems at Stations', level: 'Beginner' },
      { title: 'Dealing With Difficult Custody Staff', level: 'Intermediate' },
      { title: 'Reading Police Disclosure', level: 'Intermediate' },
      { title: 'No Comment Interview Strategy', level: 'Advanced' },
      { title: 'Building Your Reputation', level: 'Beginner' },
      { title: 'First Police Station Call Out', level: 'Beginner' },
      { title: 'Top 10 Catastrophic Fails', level: 'Intermediate' },
    ],
  },
  {
    name: 'Interview Techniques',
    articles: [
      { title: 'Mastering Police Interview Techniques', level: 'Advanced' },
      { title: 'Advanced Strategies', level: 'Advanced' },
      { title: 'Basic Techniques', level: 'Beginner' },
      { title: 'Interview Preparation', level: 'Beginner' },
    ],
  },
  {
    name: 'At The Station',
    articles: [
      { title: 'Your First Attendance Step-by-Step', level: 'Beginner' },
      { title: 'Getting Started as a Rep', level: 'Beginner' },
      { title: 'Voluntary Police Interviews Guide', level: 'Intermediate' },
      { title: 'PACE Code C Essentials', level: 'Intermediate' },
      { title: 'Custody Record Review', level: 'Intermediate' },
      { title: 'Disclosure Analysis', level: 'Advanced' },
      { title: 'Consultation Strategy', level: 'Intermediate' },
      { title: 'Interview Advice', level: 'Beginner' },
      { title: 'Outcome Recording', level: 'Beginner' },
      { title: 'Time Recording', level: 'Beginner' },
    ],
  },
  {
    name: 'Getting Started',
    articles: [
      { title: "Complete Beginner's Guide", level: 'Beginner' },
      { title: 'First Steps', level: 'Beginner' },
      { title: 'Qualification Pathway', level: 'Beginner' },
      { title: 'Voluntary Interviews Complete Guide', level: 'Intermediate' },
    ],
  },
];

const TOTAL_ARTICLES = CATEGORIES.reduce((sum, cat) => sum + cat.articles.length, 0);

const LEVEL_STYLES: Record<Article['level'], string> = {
  Beginner: 'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function PremiumPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Training Guides & Resources' },
            ]}
          />
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            FREE WHILST TESTING
          </div>
          <h1 className="text-h1 text-white">Training Guides &amp; Resources</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Browse all {TOTAL_ARTICLES}+ training articles and guides — completely free.
            Professional development, PACE essentials, billing strategies, and more for police
            station representatives.
          </p>
        </div>
      </section>

      <div className="page-container">

      <div className="mb-10 flex flex-wrap gap-3">
        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          Beginner
        </span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          Intermediate
        </span>
        <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          Advanced
        </span>
      </div>

      <div className="space-y-12">
        {CATEGORIES.map((category) => (
          <section key={category.name}>
            <h2 className="text-h2 mb-2 text-[var(--navy)]">{category.name}</h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.articles.map((article) => (
                <div
                  key={article.title}
                  className="flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]"
                >
                  <p className="flex-1 font-medium text-[var(--navy)]">{article.title}</p>
                  <span
                    className={`mt-3 inline-block self-start rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEVEL_STYLES[article.level]}`}
                  >
                    {article.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-[var(--border)] pt-10">
        <h2 className="text-h2 text-[var(--navy)]">More Resources</h2>
        <p className="mt-2 text-[var(--muted)]">
          Explore additional resources to support your police station representation practice.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/Resources"
            className="btn-gold"
          >
            Legal Resources
          </Link>
          <Link
            href="/FormsLibrary"
            className="btn-outline"
          >
            Forms Library
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
