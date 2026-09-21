export function HomeTestimonials() {
  const quotes = [
    {
      text: 'The directory saved me hours of searching. Found a rep covering Maidstone within minutes of a late-night DSCC call-out. They attended promptly and provided an excellent attendance note.',
      author: 'Criminal Defence Solicitor',
      location: 'Kent',
    },
    {
      text: 'Since joining the directory my cover instructions have increased significantly. Firms can see my availability and accreditation instantly — I receive regular work from across the South East.',
      author: 'Accredited Representative',
      location: 'London & South East',
    },
    {
      text: 'The training resources and Wiki are invaluable. As a new rep building my portfolio, having access to scenario guides and PACE references in one place has been a genuine advantage.',
      author: 'Probationary Representative',
      location: 'Greater Manchester',
    },
  ];

  return (
    <section
      className="section-pad bg-gradient-to-b from-white via-[var(--gold-pale)]/40 to-white"
      aria-label="Testimonials"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--navy)]/55">
            Social proof
          </p>
          <h2 className="font-display mt-2 text-h2 text-[var(--navy)]">What professionals say</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Feedback from solicitors and representatives using the directory
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.author + q.location}
              className="relative flex h-full flex-col rounded-2xl border border-[var(--navy)]/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <svg
                width="28"
                height="22"
                viewBox="0 0 32 24"
                fill="none"
                aria-hidden
                className="mb-4 text-[var(--gold)]"
              >
                <path
                  d="M0 24V14.4C0 6.24 5.28 1.44 13.44 0l1.92 4.32C10.08 5.76 7.68 8.64 7.2 12H13.44V24H0zm18.56 0V14.4C18.56 6.24 23.84 1.44 32 0l1.92 4.32c-5.28 1.44-7.68 4.32-8.16 7.68h6.24V24H18.56z"
                  fill="currentColor"
                />
              </svg>
              <blockquote className="flex-1 text-sm leading-relaxed text-[var(--foreground)]">
                {q.text}
              </blockquote>
              <figcaption className="mt-5 border-t border-[var(--card-border)] pt-4">
                <p className="text-sm font-bold text-[var(--navy)]">{q.author}</p>
                <p className="text-xs text-[var(--muted)]">{q.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
