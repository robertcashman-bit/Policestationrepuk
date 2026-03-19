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
    <section className="bg-white py-14 sm:py-16" aria-label="Key features">
      <div className="page-container !py-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--navy)] sm:text-3xl">
            Why Choose PoliceStationRepUK?
          </h2>
          <p className="mt-2 text-[var(--muted)]">
            The most comprehensive network for criminal defence professionals
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--card-border)] bg-white p-7 text-center shadow-sm transition-all hover:shadow-md"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--navy)] text-2xl text-white">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold text-[var(--navy)]">{f.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
