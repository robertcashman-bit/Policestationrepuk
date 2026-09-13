import { COMMON_OFFENCES } from '@/lib/common-offences-guide';
import fs from 'fs';

async function check(url: string) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    const title = (text.match(/<title>([^<]+)/i)?.[1] || '').replace(/\s+/g, ' ').slice(0, 90);
    const bad =
      res.status !== 200 ||
      /page not found|404/i.test(title) ||
      /\/search/i.test(res.url);
    return { status: res.status, final: res.url, title, bad };
  } catch (e: unknown) {
    return { status: 0, final: '', title: String(e), bad: true };
  }
}

async function main() {
  const rows = [];
  for (const o of COMMON_OFFENCES) {
    const sg = await check(o.sentencingGuidelineUrl);
    const leg = await check(o.legislationUrl);
    rows.push({
      id: o.id,
      title: o.title,
      sgStatus: sg.status,
      sgBad: sg.bad,
      sgTitle: sg.title,
      legStatus: leg.status,
      legBad: leg.bad,
      legTitle: leg.title,
      sgUrl: o.sentencingGuidelineUrl,
      legUrl: o.legislationUrl,
    });
    console.log(
      `${o.id}: SG=${sg.status}${sg.bad ? ' BAD' : ''} LEG=${leg.status}${leg.bad ? ' BAD' : ''} | ${sg.title}`
    );
  }

  const bad = rows.filter((r) => r.sgBad || r.legBad);
  console.log('\n=== SUMMARY ===');
  console.log('total', rows.length, 'bad', bad.length);
  for (const b of bad) {
    console.log('BAD', b.id, 'SG', b.sgStatus, b.sgTitle, 'LEG', b.legStatus, b.legTitle);
  }
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  fs.writeFileSync('/opt/cursor/artifacts/common-offences-url-audit.json', JSON.stringify(rows, null, 2));
  if (bad.length) process.exit(1);
}

main();
