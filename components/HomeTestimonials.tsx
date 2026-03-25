const TRUST_STATS = [
  { value: '24/7', label: 'Cover Available' },
  { value: '42', label: 'Police Forces Covered' },
  { value: '100%', label: 'Free to Use' },
  { value: '2016', label: 'Established' },
];

export function HomeTestimonials() {
  const quotes = [
    {
      text: "The directory saved me hours of searching. Found a rep covering Maidstone within minutes of a late-night DSCC call-out. They attended promptly and provided an excellent attendance note.",
      author: 'Criminal Defence Solicitor, Kent',
    },
    {
      text: 'Since joining the directory my cover instructions have increased significantly. Firms can see my availability and accreditation instantly — I receive regular work from across the South East.',
      author: 'Accredited Representative, London & South East',
    },
    {
      text: "The training resources and Wiki are invaluable. As a new rep building my portfolio, having access to scenario guides and PACE references in one place has been a genuine advantage.",
      author: 'Probationary Representative, Greater Manchester',
    },
  ];

  return (
    <section className="section-pad bg-[var(--background)]" aria-label="Trust signals and testimonials">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Trusted by Solicitors &amp; Representatives Nationwide
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Independent, free, and built for the criminal defence profession
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:mt-8">
          {TRUST_STATS.map((s) => (
            <div key={s.label} className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-extrabold text-[var(--navy)]">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-[var(--muted)]">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3 sm:mt-10 sm:gap-6">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="card-surface"
            >
              <div className="mb-3 text-2xl text-[var(--gold)]">&ldquo;</div>
              <blockquote className="text-sm leading-relaxed text-[var(--muted)]">
                {q.text}
              </blockquote>
              <p className="mt-4 text-xs font-semibold text-[var(--navy)]">— {q.author}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
