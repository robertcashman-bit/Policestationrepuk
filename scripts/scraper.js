#!/usr/bin/env node
/**
 * Puppeteer-based scraper for policestationrepuk.com
 * Extracts ALL representative data from the JS-rendered directory.
 *
 * The .com site is a React SPA using shadcn/ui-style components.
 * Cards use div.rounded-xl.text-card-foreground, NOT <article> tags.
 *
 * Usage:  node scripts/scraper.js [--url <base>] [--out <path>]
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'https://policestationrepuk.com';

const OUT_PATH = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(__dirname, '..', 'data', 'scraped-reps.json');

const DIRECTORY_PATH = '/directory';
const TIMEOUT_MS = 60_000;
const LOAD_MORE_DELAY = 2000;
const MAX_RETRIES = 3;

const CARD_SELECTOR = '.rounded-xl.text-card-foreground';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });
}

async function waitForDirectory(page) {
  console.log(`[scraper] Navigating to ${BASE_URL}${DIRECTORY_PATH}`);
  await page.goto(`${BASE_URL}${DIRECTORY_PATH}`, {
    waitUntil: 'networkidle2',
    timeout: TIMEOUT_MS,
  });

  const pageTitle = await page.title();
  console.log(`[scraper] Page title: ${pageTitle}`);

  // Wait for React hydration — the site is a client-side SPA
  console.log('[scraper] Waiting for React hydration...');
  await sleep(3000);

  let cardCount = 0;
  for (let wait = 0; wait < 15; wait++) {
    cardCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, CARD_SELECTOR);
    if (cardCount > 0) break;
    console.log(`[scraper] No cards yet, waiting... (${wait + 1}/15)`);
    await sleep(2000);
  }

  if (cardCount === 0) {
    const debugPath = path.join(__dirname, '..', 'data', 'scraper-debug.png');
    await page.screenshot({ path: debugPath, fullPage: true });
    throw new Error('No rep cards found on directory page');
  }

  console.log(`[scraper] Directory loaded — found ${cardCount} rep cards`);
}

async function loadAllReps(page) {
  let previousCount = 0;
  let staleRounds = 0;

  while (true) {
    let currentCount;
    try {
      currentCount = await page.evaluate(
        (sel) => document.querySelectorAll(sel).length,
        CARD_SELECTOR
      );
    } catch (err) {
      // Context may have been destroyed by SPA navigation — wait and retry
      console.log('[scraper] Context lost, waiting for page to stabilize...');
      await sleep(3000);
      try {
        await page.waitForSelector(CARD_SELECTOR, { timeout: 15000 });
        currentCount = await page.evaluate(
          (sel) => document.querySelectorAll(sel).length,
          CARD_SELECTOR
        );
      } catch {
        console.log('[scraper] Could not recover context — proceeding with current data');
        break;
      }
    }

    console.log(`[scraper] Currently loaded: ${currentCount} rep cards`);

    if (currentCount === previousCount) {
      staleRounds++;
      if (staleRounds >= 3) {
        console.log('[scraper] No new cards after 3 rounds — all reps loaded');
        break;
      }
    } else {
      staleRounds = 0;
    }
    previousCount = currentCount;

    try {
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const loadMore = buttons.find(
          (b) =>
            b.textContent.includes('Load More') ||
            b.textContent.includes('Show More') ||
            b.textContent.includes('Load more')
        );
        if (loadMore) {
          loadMore.scrollIntoView({ behavior: 'smooth', block: 'center' });
          loadMore.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        console.log('[scraper] No "Load More" button found — all reps visible');
        break;
      }
    } catch (err) {
      console.log(`[scraper] Load More click error: ${err.message}`);
      // If clicking caused a navigation, wait for it to complete
      try {
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        await sleep(3000);
        await page.waitForSelector(CARD_SELECTOR, { timeout: 15000 });
      } catch {
        // Navigation might not happen, just continue
      }
      continue;
    }

    await sleep(LOAD_MORE_DELAY);

    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } catch {
      // ignore scroll errors
    }
    await sleep(500);
  }
}

async function revealAllContactDetails(page) {
  console.log('[scraper] Revealing contact details on all cards...');

  let revealed = 0;
  let remaining = true;

  while (remaining) {
    const clickedCount = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const showBtns = buttons.filter(
        (b) => b.textContent.trim() === 'Show Contact Details'
      );
      let clicked = 0;
      showBtns.slice(0, 10).forEach((btn) => {
        btn.click();
        clicked++;
      });
      return { clicked, remaining: showBtns.length - clicked };
    });

    revealed += clickedCount.clicked;
    remaining = clickedCount.remaining > 0;

    if (clickedCount.clicked > 0) {
      await sleep(300);
    }
  }

  console.log(`[scraper] Revealed contact details on ${revealed} cards`);
}

async function extractRepData(page) {
  console.log('[scraper] Extracting rep data from DOM...');

  // Debug: log what we can see
  const debugInfo = await page.evaluate(() => {
    const allCards = document.querySelectorAll('.rounded-xl');
    const textCards = document.querySelectorAll('.text-card-foreground');
    const h3s = document.querySelectorAll('h3');
    return {
      roundedXl: allCards.length,
      textCardForeground: textCards.length,
      h3Count: h3s.length,
      h3Texts: Array.from(h3s).slice(0, 5).map((h) => h.textContent.trim()),
      bodyClasses: document.body.className,
    };
  });
  console.log(`[scraper] Debug: ${debugInfo.roundedXl} .rounded-xl, ${debugInfo.textCardForeground} .text-card-foreground, ${debugInfo.h3Count} h3s`);
  console.log(`[scraper] First h3s: ${debugInfo.h3Texts.join(', ')}`);

  const reps = await page.evaluate((cardSel) => {
    // Try multiple card selectors
    let cards = document.querySelectorAll(cardSel);
    if (cards.length === 0) {
      // Fallback: find cards by looking at grid children that contain h3
      const grids = document.querySelectorAll('[class*="grid"][role="list"], [class*="grid gap"]');
      grids.forEach((grid) => {
        const children = grid.children;
        if (children.length > cards.length) cards = children;
      });
    }
    if (cards.length === 0) {
      // Another fallback: find all divs that contain both h3 and a button with "Show Contact"
      const allDivs = document.querySelectorAll('div');
      const repDivs = [];
      allDivs.forEach((div) => {
        const h3 = div.querySelector('h3');
        const showBtn = Array.from(div.querySelectorAll('button')).find(
          (b) => b.textContent.includes('Show Contact') || b.textContent.includes('View Full Profile')
        );
        if (h3 && showBtn && div.className.includes('rounded')) {
          repDivs.push(div);
        }
      });
      cards = repDivs;
    }
    const results = [];

    cards.forEach((card) => {
      try {
        // Name from h3
        const h3 = card.querySelector('h3');
        const name = h3 ? h3.textContent.trim() : '';
        if (!name) return;

        // Accreditation from badge divs
        let accreditation = '';
        const badgeDivs = card.querySelectorAll('.inline-flex.items-center.rounded-md');
        badgeDivs.forEach((badge) => {
          const text = badge.textContent.trim();
          if (
            text.includes('Accredited') ||
            text.includes('Duty Solicitor') ||
            text.includes('Probationary') ||
            text.includes('Law Society')
          ) {
            accreditation = text;
          }
        });

        // Featured status
        const isFeatured =
          card.className.includes('amber') ||
          card.className.includes('orange') ||
          card.innerHTML.includes('Spotlight') ||
          card.innerHTML.includes('Featured') ||
          card.innerHTML.includes('Advertisement');

        // County/location — inside the map-pin section
        let county = '';
        const mapPinSections = card.querySelectorAll('.flex.items-start');
        mapPinSections.forEach((section) => {
          if (section.querySelector('.lucide-map-pin')) {
            const locationDiv = section.querySelector('.font-medium');
            if (locationDiv) county = locationDiv.textContent.trim();
          }
        });
        if (!county) {
          const allFontMedium = card.querySelectorAll('.font-medium');
          allFontMedium.forEach((el) => {
            const text = el.textContent.trim();
            if (
              text &&
              !text.includes('Show') &&
              !text.includes('View') &&
              !text.includes('Visit') &&
              !text.includes('•••') &&
              !text.includes('Availability')
            ) {
              if (!county) county = text;
            }
          });
        }

        // Availability
        let availability = '';
        const availSpans = card.querySelectorAll('span');
        for (let i = 0; i < availSpans.length; i++) {
          if (availSpans[i].textContent.includes('Availability:')) {
            const nextSibling = availSpans[i].nextElementSibling;
            if (nextSibling) {
              availability = nextSibling.textContent.trim();
            }
            break;
          }
        }

        // Phone — after clicking "Show Contact Details"
        let phone = '';
        const telLinks = card.querySelectorAll('a[href^="tel:"]');
        if (telLinks.length > 0) {
          phone = telLinks[0].getAttribute('href').replace('tel:', '').trim();
        }
        if (!phone) {
          const phoneSpans = card.querySelectorAll('.font-medium');
          phoneSpans.forEach((span) => {
            const text = span.textContent.trim();
            if (/^0\d{10,}$/.test(text.replace(/\s/g, ''))) {
              phone = text;
            }
          });
        }

        // Email
        let email = '';
        const mailLinks = card.querySelectorAll('a[href^="mailto:"]');
        if (mailLinks.length > 0) {
          email = mailLinks[0].getAttribute('href').replace('mailto:', '').trim();
        }

        // Profile link (spotlightprofile)
        let profileId = '';
        let slug = '';
        const profileLink = card.querySelector('a[href*="spotlightprofile"]');
        if (profileLink) {
          const href = profileLink.getAttribute('href');
          const idMatch = href.match(/id=([^&]+)/);
          if (idMatch) profileId = idMatch[1];
        }
        slug =
          profileId ||
          name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-');

        // Website URL
        let websiteUrl = '';
        const externalLinks = card.querySelectorAll(
          'a[target="_blank"][rel*="noopener"]'
        );
        externalLinks.forEach((link) => {
          const href = link.getAttribute('href');
          if (href && !href.includes('policestationrepuk')) {
            websiteUrl = href;
          }
        });

        // Stations — look for station pills/badges
        const stations = [];
        const stationEls = card.querySelectorAll(
          '.bg-blue-50, .bg-slate-100, [class*="station"]'
        );
        stationEls.forEach((el) => {
          const text = el.textContent.trim();
          if (text && !text.includes('Visit') && text.length < 80) {
            stations.push(text);
          }
        });

        // Bio/quote
        let bio = '';
        const quoteEls = card.querySelectorAll('p, .italic, blockquote');
        quoteEls.forEach((el) => {
          const text = el.textContent.trim();
          if (
            text.length > 30 &&
            !text.includes('placements are promoted') &&
            !text.includes('All notes back') &&
            !text.includes('Availability')
          ) {
            if (!bio || text.length > bio.length) bio = text;
          }
        });

        results.push({
          name,
          phone,
          email,
          county,
          availability,
          accreditation,
          featured: isFeatured,
          stations,
          bio,
          slug,
          profileId,
          websiteUrl,
        });
      } catch (err) {
        // Skip cards that fail to parse
      }
    });

    return results;
  }, CARD_SELECTOR);

  return reps;
}

async function scrapeProfilePages(page, reps) {
  console.log('[scraper] Enriching data from individual profile pages...');

  const profileIds = reps.filter((r) => r.profileId).map((r) => r.profileId);
  const slugReps = reps.filter((r) => !r.profileId);

  let enriched = 0;

  for (const rep of reps) {
    // Only visit profile pages for reps with a known Base44 profileId
    // Non-featured reps don't have spotlight pages, and /rep/slug
    // doesn't exist on the .com site (it's a different platform)
    if (!rep.profileId) continue;

    const profileUrl = `${BASE_URL}/spotlightprofile?id=${rep.profileId}`;

    try {
      await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await sleep(2000);

      const profileData = await page.evaluate(() => {
        const data = { stations: [], phone: '', email: '', county: '', availability: '', bio: '' };

        // Phone
        const telLinks = document.querySelectorAll('a[href^="tel:"]');
        if (telLinks.length > 0) {
          data.phone = telLinks[0].getAttribute('href').replace('tel:', '').trim();
        }

        // Email
        const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
        if (mailLinks.length > 0) {
          data.email = mailLinks[0].getAttribute('href').replace('mailto:', '').trim();
        }

        // County from map pin sections
        const mapSections = document.querySelectorAll('.flex.items-start, .flex.items-center');
        mapSections.forEach((section) => {
          if (section.querySelector('.lucide-map-pin, [class*="map-pin"]')) {
            const locEl = section.querySelector('.font-medium, .font-semibold');
            if (locEl) data.county = locEl.textContent.trim();
          }
        });

        // Availability
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach((span) => {
          if (span.textContent.includes('Availability:')) {
            const next = span.nextElementSibling;
            if (next) data.availability = next.textContent.trim();
          }
        });

        // Stations — look for station-related sections
        const stationHeaders = document.querySelectorAll('h3, h4, .font-semibold');
        stationHeaders.forEach((header) => {
          if (
            header.textContent.includes('Station') ||
            header.textContent.includes('Coverage')
          ) {
            const parent = header.parentElement;
            if (parent) {
              const pills = parent.querySelectorAll(
                '.rounded-full, .bg-blue-50, .badge, [class*="pill"]'
              );
              pills.forEach((pill) => {
                const text = pill.textContent.trim();
                if (text && text.length < 80) data.stations.push(text);
              });
            }
          }
        });

        // Bio
        const paragraphs = document.querySelectorAll('p');
        paragraphs.forEach((p) => {
          const text = p.textContent.trim();
          if (text.length > 50 && text.length < 1000) {
            if (!data.bio || text.length > data.bio.length) {
              if (
                !text.includes('Availability') &&
                !text.includes('placements') &&
                !text.includes('directory')
              ) {
                data.bio = text;
              }
            }
          }
        });

        return data;
      });

      // Merge profile data into rep (only fill gaps, skip site-wide phone)
      if (profileData.phone && !rep.phone && profileData.phone !== '01732247427') {
        rep.phone = profileData.phone;
      }
      if (profileData.email && !rep.email) rep.email = profileData.email;
      if (profileData.county && !rep.county) rep.county = profileData.county;
      if (profileData.availability && !rep.availability) rep.availability = profileData.availability;
      if (profileData.bio && !rep.bio) rep.bio = profileData.bio;
      if (profileData.stations.length > rep.stations.length) {
        rep.stations = profileData.stations;
      }

      enriched++;
      if (enriched % 10 === 0) {
        console.log(`[scraper] Enriched ${enriched}/${reps.length} profiles...`);
      }
    } catch (err) {
      // Skip profiles that fail
    }
  }

  console.log(`[scraper] Profile enrichment complete: ${enriched}/${reps.length}`);
  return reps;
}

function deduplicateReps(reps) {
  const seen = new Map();
  for (const rep of reps) {
    const key = rep.slug || rep.name.toLowerCase().replace(/\s+/g, '-');
    if (!seen.has(key)) {
      seen.set(key, rep);
    } else {
      const existing = seen.get(key);
      if (rep.phone && !existing.phone) existing.phone = rep.phone;
      if (rep.email && !existing.email) existing.email = rep.email;
      if (rep.county && !existing.county) existing.county = rep.county;
      if (rep.availability && !existing.availability) existing.availability = rep.availability;
      if (rep.stations.length > existing.stations.length) existing.stations = rep.stations;
      if (rep.bio && !existing.bio) existing.bio = rep.bio;
    }
  }
  return Array.from(seen.values());
}

const SITE_PHONE = '01732247427';
const JUNK_STATION_PATTERNS = [
  /featured/i,
  /listing/i,
  /advertisement/i,
  /spotlight/i,
  /🎯/,
  /promoted/i,
];

function cleanReps(reps) {
  return reps.map((rep) => {
    let phone = (rep.phone || '').trim();
    // Remove site-wide phone number that leaks from the header/footer
    if (phone === SITE_PHONE || phone === `+44${SITE_PHONE.slice(1)}`) {
      phone = '';
    }

    let bio = (rep.bio || '').trim();
    // Remove 404-page text from failed profile enrichment
    if (bio.includes('could not be found') || bio.includes('page not found') || bio.includes('404')) {
      bio = '';
    }
    // Strip wrapping quotes from profile-page bios
    bio = bio.replace(/^[""\u201c]+/, '').replace(/[""\u201d]+$/, '');

    const stations = (rep.stations || [])
      .map((s) => s.trim())
      .filter((s) => {
        if (!s) return false;
        return !JUNK_STATION_PATTERNS.some((pat) => pat.test(s));
      });

    let county = (rep.county || '').trim();
    // Normalize county casing
    if (county === 'ESSEX') county = 'Essex';
    if (county === 'middx') county = 'Middlesex';
    if (county === 'uk' || county === 'GB' || county === 'united kingdom') county = '';
    if (county === 'County') county = '';

    // Clean the name prefix from featured reps
    let name = (rep.name || '').trim();
    name = name.replace(/^Always available\s*-\s*/i, '').trim();

    return {
      name,
      phone,
      email: (rep.email || '').trim(),
      county,
      availability: (rep.availability || '').trim(),
      accreditation: (rep.accreditation || '').trim(),
      featured: Boolean(rep.featured),
      stations,
      bio,
      slug: (rep.slug || '').trim(),
      websiteUrl: (rep.websiteUrl || '').trim(),
    };
  });
}

async function run() {
  console.log('============================================');
  console.log('  PoliceStationRepUK.com — Data Scraper');
  console.log('============================================');
  console.log(`Source:  ${BASE_URL}`);
  console.log(`Output:  ${OUT_PATH}`);
  console.log('');

  let browser;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    attempt++;
    console.log(`[scraper] Attempt ${attempt}/${MAX_RETRIES}`);

    try {
      browser = await launchBrowser();
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Step 1: Load directory page
      await waitForDirectory(page);

      // Step 2: Click "Load More" until all reps are visible on the page
      try {
        let pageNum = 1;
        let staleRounds = 0;
        let prevCardCount = 0;

        while (true) {
          let cardCount;
          try {
            cardCount = await page.evaluate(
              (sel) => document.querySelectorAll(sel).length,
              CARD_SELECTOR
            );
          } catch {
            break;
          }

          console.log(`[scraper] Cards on page: ${cardCount}`);

          if (cardCount === prevCardCount) {
            staleRounds++;
            if (staleRounds >= 2) break;
          } else {
            staleRounds = 0;
          }
          prevCardCount = cardCount;

          const hasMore = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.some(
              (b) =>
                b.textContent.includes('Load More') ||
                b.textContent.includes('Show More') ||
                b.textContent.includes('Load more')
            );
          }).catch(() => false);

          if (!hasMore) {
            console.log('[scraper] No more pages to load');
            break;
          }

          console.log(`[scraper] Clicking Load More (page ${++pageNum})...`);

          try {
            await page.evaluate(() => {
              const btn = Array.from(document.querySelectorAll('button')).find(
                (b) =>
                  b.textContent.includes('Load More') ||
                  b.textContent.includes('Show More') ||
                  b.textContent.includes('Load more')
              );
              if (btn) btn.click();
            });
          } catch {
            break;
          }

          await sleep(LOAD_MORE_DELAY);
        }
      } catch (err) {
        console.log(`[scraper] Pagination error: ${err.message}`);
      }

      // Step 3: Click "Show Contact Details" on every card to reveal phone/email
      await revealAllContactDetails(page);

      // Step 4: Extract data from ALL visible cards
      let reps = await extractRepData(page);
      console.log(`[scraper] Extracted ${reps.length} reps`);

      if (reps.length === 0) {
        throw new Error('No reps extracted — page may not have rendered');
      }

      // Step 4: Deduplicate
      reps = deduplicateReps(reps);
      console.log(`[scraper] After dedup: ${reps.length} unique reps`);

      // Step 5: Enrich from profile pages
      reps = await scrapeProfilePages(page, reps);

      // Step 6: Clean and output
      reps = cleanReps(reps);

      const outDir = path.dirname(OUT_PATH);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(OUT_PATH, JSON.stringify(reps, null, 2), 'utf-8');

      console.log('');
      console.log('============================================');
      console.log(`  SUCCESS — ${reps.length} reps written`);
      console.log(`  ${OUT_PATH}`);
      console.log('============================================');

      const countySummary = {};
      reps.forEach((r) => {
        const c = r.county || 'Unknown';
        countySummary[c] = (countySummary[c] || 0) + 1;
      });
      console.log('\nCounty breakdown:');
      Object.entries(countySummary)
        .sort(([, a], [, b]) => b - a)
        .forEach(([county, count]) => console.log(`  ${county}: ${count}`));

      await browser.close();
      return;
    } catch (err) {
      console.error(`[scraper] Attempt ${attempt} failed: ${err.message}`);
      if (browser) await browser.close().catch(() => {});
      if (attempt >= MAX_RETRIES) {
        console.error('[scraper] All retries exhausted. Exiting with error.');
        process.exit(1);
      }
      console.log('[scraper] Retrying in 5 seconds...');
      await sleep(5000);
    }
  }
}

run().catch((err) => {
  console.error('[scraper] Fatal error:', err);
  process.exit(1);
});
