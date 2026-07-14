# Police station number validation

## Normalisation

| Form | Function |
|------|----------|
| Digits with leading 0 | `normalizePhoneDigits` |
| UK display | `formatPhoneUk` |
| E.164 | `toE164Uk` (libphonenumber-js GB parse, then regex fallback) |

## Rejection rules (hard)

- Emergency / short codes: 999, 112, 911 (extraction); 101 treated as non-station-specific.
- Force generic denylist: `isGenericCustodyNumber`.
- Implausible fields: URLs, prose, wrong lengths (`isPlausibleUkPhoneField`).
- Unsafe ranges for auto-publish: mobiles / premium (`number-safety.ts`).

## Contextual classification

Deterministic scoring (`scorePhoneCandidate`):

- +50 custody wording;
- +25 enquiry / contact wording;
- +15 per suite-name token match;
- −80 solicitor/victim context;
- −40 switchboard / 101 wording.

Minimum score to keep: `MIN_PHONE_CANDIDATE_SCORE` (10).

## Evidence validation before publish

1. Number appears in fetched page/PDF excerpt.
2. Evidence kind is `page_fetch` or `pdf_fetch`.
3. Custody wording present for custody publish path.
4. AI JSON validated; empty/malformed → hold, keep deterministic finding.
5. Conflicting trusted numbers → manual review / conflict resolver.

## Shared numbers

`clusterSharedNumbers` flags numbers seen on ≥3 suites. Shared force switchboards are **labelled**, not auto-deleted.

## Preservation rule

Never replace an approved public number with a failed search or lower-confidence candidate (`hardGates` reason `different_approved_number`; recheck downgrades verification instead of deleting).
