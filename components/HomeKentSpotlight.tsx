import Link from 'next/link';

export function HomeKentSpotlight() {
  return (
    <section className="bg-[var(--gold-pale)] py-14 sm:py-16">
      <div className="page-container">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Need a Police Station Rep in Kent?
          </h3>
          <p className="mt-3 text-[var(--muted)]">
            Extensive coverage across Kent with accredited representatives available 24/7
            at Maidstone, Canterbury, Medway, Folkestone, Tunbridge Wells, and more.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/PoliceStationRepsKent" className="btn-navy !text-sm">
              Find Kent Reps
            </Link>
            <Link href="/PoliceStationRepsByCounty" className="btn-outline !text-sm">
              Browse All Counties
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['Maidstone', 'Canterbury', 'Medway', 'Folkestone', 'Tunbridge Wells', 'Gravesend', 'Dartford', 'Ashford'].map(
              (station) => (
                <span
                  key={station}
                  className="rounded-full border border-[var(--gold)]/30 bg-white px-3 py-1 text-xs font-medium text-[var(--navy)]"
                >
                  {station}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
