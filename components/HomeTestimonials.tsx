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
    <section className="bg-[var(--background)] py-14 sm:py-16" aria-label="User testimonials">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
            Trusted by Industry Leaders
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--card-border)] bg-white p-6 shadow-sm"
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
