export function HomeHowItWorks() {
  const steps = [
    {
      step: 1,
      icon: '🔍',
      title: 'Search the directory',
      body: 'Find accredited police station representatives by county, station, or name. Filter by availability and accreditation.',
    },
    {
      step: 2,
      icon: '📞',
      title: 'Contact directly',
      body: 'Call or message the rep using their profile details. They can confirm availability and coverage instantly.',
    },
    {
      step: 3,
      icon: '⚖️',
      title: 'They attend for your client',
      body: 'The representative attends the custody suite to advise your client, review disclosure, and support during interview.',
    },
  ];
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="page-container">
        <div className="text-center">
          <h2 className="text-h2 !mt-0 text-[var(--navy)]">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
            Find and instruct accredited reps in three simple steps.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map(({ step, icon, title, body }) => (
            <div
              key={step}
              className="relative rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-7 text-center shadow-[var(--card-shadow)]"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--navy)] text-2xl text-white shadow-md">
                {icon}
              </div>
              <span className="mt-4 inline-block rounded-full bg-[var(--gold)]/10 px-3 py-0.5 text-xs font-bold text-[var(--gold-link)]">
                Step {step}
              </span>
              <h3 className="mt-3 text-lg font-bold text-[var(--navy)]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
