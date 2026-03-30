import re
from pathlib import Path

NEW = """  const countyMap = useMemo(() => buildCountyCanonicalMap(counties.map((c) => c.name)), [counties]);

  const rows = useMemo(
    () => reps.map((r) => representativeToSearchRow(r, countyMap)),
    [reps, countyMap],
  );

  const preFilteredRows = useMemo(() => {
    return rows.filter((row) => {
      const r = row.rep;
      if (county && !repMatchesCountyName(r.county, county)) return false;

      const stationTrim = station.trim();
      if (stationTrim) {
        const st = stationTrim.toLowerCase();
        const inList = (r.stations || []).some((s) => s.toLowerCase().includes(st));
        const inJoined = row.stations.toLowerCase().includes(st);
        if (!inList && !inJoined) return false;
      }

      if (availability && normalizeAvailability(r.availability) !== availability) return false;

      if (accreditation && !(r.accreditation || '').toLowerCase().includes(accreditation.toLowerCase()))
        return false;

      return true;
    });
  }, [rows, county, station, availability, accreditation]);

  const textHits = useMemo(
    () => searchDirectory(preFilteredRows, debouncedQuery),
    [preFilteredRows, debouncedQuery],
  );

  const filtered = useMemo(() => {
    const hasQ = normalize(debouncedQuery).length > 0;

    const sortRows = (list: DirectorySearchRow[]) => {
      const copy = [...list];
      const cmpRep = (a: Representative, b: Representative) => {
        if (sort === 'experience') return (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0);
        if (sort === 'stations') return (b.stations || []).length - (a.stations || []).length;
        return (a.name || '').localeCompare(b.name || '');
      };
      if (!hasQ || sort !== 'relevance') {
        copy.sort((a, b) => cmpRep(a.rep, b.rep));
      }
      return copy;
    };

    const orderedRows = sortRows(textHits);
    const repsList = orderedRows.map((row) => row.rep);
    const featured = repsList.filter((r) => r.featured);
    const nonFeatured = repsList.filter((r) => !r.featured);
    return [...featured, ...nonFeatured];
  }, [textHits, debouncedQuery, sort]);
"""

def main():
    p = Path("components/DirectorySearch.tsx")
    t = p.read_text(encoding="utf-8")
    pat = re.compile(
        r"  const filtered = useMemo\(\(\) => \{.*?  \}, \[reps, stations, counties, query, county, station, availability, accreditation, sort\]\);\r?\n",
        re.DOTALL,
    )
    if not pat.search(t):
        raise SystemExit("pattern not found")
    t = pat.sub(NEW + "\n", t, count=1)
    p.write_text(t, encoding="utf-8")
    print("ok")

if __name__ == "__main__":
    main()
