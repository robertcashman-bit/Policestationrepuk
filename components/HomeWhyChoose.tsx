export function HomeWhyChoose() {
  const features = [
    {
      icon: '✓',
      title: 'Registered Professionals',
      body: 'Access a curated list of accredited and duty-solicitor qualified representatives. Details verified at registration.',
    },
    {
      icon: '🌍',
      title: 'Nationwide Coverage',
      body: 'Find representatives covering police stations across England and Wales, from major cities to rural areas, 24/7.',
    },
    {
      icon: '⚡',
      title: 'Instant Connection',
      body: 'Connect with reps immediately via phone, email or SMS to ensure timely legal representation for your clients.',
    },
  ];

  return (
    <section className="section-pad bg-white" aria-label="Key features">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-h2 mt-0 text-[var(--navy)]">
            Why Choose PoliceStationRepUK?
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            The most comprehensive network for criminal defence professionals
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3 sm:mt-10 sm:gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-surface text-center transition-shadow hover:shadow-[var(--card-shadow-hover)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--navy)] text-xl text-white sm:h-14 sm:w-14 sm:text-2xl">
                {f.icon}
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--navy)] sm:mt-5 sm:text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] sm:mt-3">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
