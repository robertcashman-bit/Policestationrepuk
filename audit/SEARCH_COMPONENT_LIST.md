# Search component list

Generated: 2026-03-25T23:05:06.032Z

## DirectorySearch

- **File:** `components/DirectorySearch.tsx`
- **Pages:** /directory, /search
- **Data:** Representative[], County[], PoliceStation[] from getAll*
- **Behaviour:** Live filter + URL sync (400ms debounce); county/station/availability/accreditation; pagination
- **Notes:** Trim free-text q for matching and URL; Trim station filter so whitespace-only does not over-filter

## HomeQuickSearch

- **File:** `components/HomeQuickSearch.tsx`
- **Pages:** /
- **Data:** Station names + county names from homepage loader
- **Behaviour:** Form GET → /directory?q=&station=&county=
- **Notes:** —

## StationsDirectoryExplorer

- **File:** `components/StationsDirectoryExplorer.tsx`
- **Pages:** /StationsDirectory
- **Data:** PoliceStation[]
- **Behaviour:** Trim query; haystack match on name/address/postcode/county/force/phones
- **Notes:** —

## MapPageStationSearch

- **File:** `app/Map/page.tsx`
- **Pages:** /Map
- **Data:** GET /api/stations JSON
- **Behaviour:** Client fetch; trim query before name/county/address filter
- **Notes:** —

## FirmDirectory

- **File:** `components/FirmDirectory.tsx`
- **Pages:** /Firms
- **Data:** LawFirm[]
- **Behaviour:** Trim query; filter name/address/county/specialisms; county + sort
- **Notes:** —


## Forms (discovery)

- `components/HomeQuickSearch.tsx` — router.push → /directory?...
- `app/register/page.tsx` — Registration flow
- `app/Contact/page.tsx` — Contact — verify submit in browser
