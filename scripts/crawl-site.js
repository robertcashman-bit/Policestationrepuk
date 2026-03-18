/**
 * Crawl policestationrepuk.com: discover all internal links, crawl every page,
 * capture URL, title, headings, visible text, images, internal links.
 * Saves to data/pages.json. Optionally extracts directory data to data/reps.json,
 * data/stations.json, data/counties.json.
 *
 * Run: node scripts/crawl-site.js
 * Requires: npm install && npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://policestationrepuk.com';
const BASE_ORIGIN = new URL(BASE_URL).origin;
const DATA_DIR = path.join(process.cwd(), 'data');
const DELAY_MS = 1500;
const MAX_PAGES = 500; // safety limit

function normalizePath(href) {
  try {
    const u = new URL(href, BASE_URL);
    if (u.origin !== BASE_ORIGIN) return null;
    let p = u.pathname || '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  } catch {
    return null;
  }
}

const EXTRACT_SCRIPT = `
(function() {
  function getText(el) {
    return el ? (el.textContent || '').trim() : '';
  }
  var headings = [];
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(function(el) {
    var tag = el.tagName.toLowerCase();
    var level = parseInt(tag.charAt(1), 10);
    var text = getText(el);
    if (text) headings.push({ level: level, text: text });
  });
  var main = document.querySelector('main, [role="main"], article, .content, #content, .main') || document.body;
  var raw = main ? (main.textContent || '').trim() : '';
  var content = raw.replace(/\\s+/g, ' ').slice(0, 100000);
  var links = [];
  var base = window.location.origin;
  document.querySelectorAll('a[href]').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    var absolute;
    try { absolute = href.startsWith('http') ? href : new URL(href, base).href; } catch (e) { return; }
    if (!absolute.startsWith(base)) return;
    var pathname = new URL(absolute).pathname || '/';
    links.push({ href: pathname, text: getText(a) });
  });
  var seen = {};
  var uniqueLinks = links.filter(function(l) {
    if (seen[l.href]) return false;
    seen[l.href] = true;
    return true;
  });
  var images = [];
  document.querySelectorAll('img[src]').forEach(function(img) {
    var src = img.getAttribute('src');
    if (!src) return;
    try {
      var full = src.startsWith('http') ? src : new URL(src, base).href;
      if (full.startsWith(base)) images.push({ src: full, alt: (img.getAttribute('alt') || '').trim() });
    } catch (e) {}
  });
  return { title: document.title || '', headings: headings, content: content, links: uniqueLinks, images: images };
})()
`;

async function crawlPage(browser, urlPath) {
  const pathNorm = !urlPath || urlPath === '/' ? '/' : urlPath.startsWith('/') ? urlPath : '/' + urlPath;
  const url = pathNorm === '/' ? BASE_URL : BASE_URL + pathNorm;
  const page = await browser.newPage();
  const result = {
    url,
    path: pathNorm,
    title: '',
    headings: [],
    content: '',
    links: [],
    images: [],
    crawledAt: new Date().toISOString(),
  };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const extracted = await page.evaluate(EXTRACT_SCRIPT);
    result.title = extracted.title || '';
    result.headings = extracted.headings || [];
    result.content = extracted.content || '';
    result.links = extracted.links || [];
    result.images = extracted.images || [];
  } catch (err) {
    result.error = err.message || String(err);
  } finally {
    await page.close();
  }
  return result;
}

function extractStructuredData(pages) {
  const reps = [];
  const stations = [];
  const counties = [];
  for (const p of pages) {
    if (p.error) continue;
    if (p.path === '/Directory' || (p.path && p.path.includes('Rep'))) {
      const countyMatch = p.path.match(/PoliceStationReps([A-Za-z]+)/);
      if (countyMatch) {
        const name = countyMatch[1].replace(/([A-Z])/g, ' $1').trim();
        if (!counties.some((c) => c.path === p.path)) {
          counties.push({
            id: counties.length + 1,
            name,
            slug: p.path.replace(/^\//, '').toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, ''),
            path: p.path,
          });
        }
      }
    }
  }
  return { reps, stations, counties };
}

async function main() {
  console.log('Crawling', BASE_URL, '— discovering links and capturing content...\n');
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const seen = new Set();
  const queue = ['/'];
  const pages = [];
  let done = 0;

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const urlPath = queue.shift();
    const pathNorm = !urlPath || urlPath === '/' ? '/' : urlPath.startsWith('/') ? urlPath : '/' + urlPath;
    if (seen.has(pathNorm)) continue;
    seen.add(pathNorm);

    process.stdout.write('[' + (done + 1) + '] ' + pathNorm + ' ... ');
    const data = await crawlPage(browser, pathNorm);
    pages.push(data);
    done++;

    if (data.error) {
      console.log('ERROR:', data.error);
    } else {
      console.log('OK', '(title:', (data.title || '').slice(0, 40) + '...,', data.links.length, 'links)');
      for (const link of data.links || []) {
        const p = normalizePath(link.href);
        if (p && !seen.has(p)) queue.push(p);
      }
    }

    if (queue.length > 0 && done < MAX_PAGES) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  await browser.close();

  const payload = {
    baseUrl: BASE_URL,
    crawledAt: new Date().toISOString(),
    count: pages.length,
    pages,
  };
  const pagesPath = path.join(DATA_DIR, 'pages.json');
  fs.writeFileSync(pagesPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log('\nSaved', pages.length, 'pages to', pagesPath);

  const { reps, stations, counties } = extractStructuredData(pages);
  if (reps.length > 0) fs.writeFileSync(path.join(DATA_DIR, 'reps.json'), JSON.stringify(reps, null, 2), 'utf-8');
  if (stations.length > 0) fs.writeFileSync(path.join(DATA_DIR, 'stations.json'), JSON.stringify(stations, null, 2), 'utf-8');
  if (counties.length > 0) fs.writeFileSync(path.join(DATA_DIR, 'counties.json'), JSON.stringify(counties, null, 2), 'utf-8');
  if (reps.length || stations.length || counties.length) {
    console.log('Extracted directory data: reps', reps.length, 'stations', stations.length, 'counties', counties.length);
  }

  const publicDir = path.join(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });
  const sitemapUrls = [BASE_URL].concat(pages.map((p) => BASE_URL + (p.path === '/' ? '' : p.path)));
  const sitemapXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapUrls.map((u) => '  <url><loc>' + u.replace(/&/g, '&amp;') + '</loc><changefreq>weekly</changefreq></url>').join('\n') +
    '\n</urlset>';
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('Wrote public/sitemap.xml');
  const robotsTxt = 'User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ' + BASE_URL + '/sitemap.xml\n';
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('Wrote public/robots.txt');

  console.log('\nDone. Run "npm run dev" to view the mirrored site.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
