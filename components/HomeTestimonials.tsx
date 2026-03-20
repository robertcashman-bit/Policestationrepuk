export function HomeTestimonials() {
  const quotes = [
    {
      text: "The premium guides paid for themselves in the first week. 'Get Work as a Rep' showed me exactly how to approach firms and I landed 3 new clients immediately.",
      author: 'Verified Representative',
    },
    {
      text: 'Featured status transformed my practice. Went from 2-3 calls a month to 15+. The ROI is insane for £5/year.',
      author: 'Featured Rep',
    },
    {
      text: "The Wiki is like having a senior rep mentor available 24/7. Every scenario I've faced is covered in detail. Absolutely invaluable for new reps.",
      author: 'Directory Member',
    },
  ];

  return (
    <section className="section-pad bg-[var(--background)]" aria-label="User testimonials">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Trusted by Industry Leaders
          </h2>
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
