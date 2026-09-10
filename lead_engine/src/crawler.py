from __future__ import annotations

import html
import re
import time
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser

import requests
import tldextract

from .config import EngineConfig
from .database import Database, utc_now

# Website fields sometimes contain HTML fragments (&nbsp;, truncated quotes, etc.).
_HTML_ENTITY_RE = re.compile(r"&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);", re.IGNORECASE)
_URL_CONTAMINATION_RE = re.compile(r"%22|%27|&nbsp", re.IGNORECASE)
_UNICODE_SPACE_RE = re.compile(r"[\s\u00a0\u2000-\u200b\ufeff]+")
_DNS_LABEL_RE = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$")

CRAWL_PATHS = [
    "/",
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/our-people",
    "/team",
    "/people",
    "/solicitors",
    "/lawyers",
    "/partners",
    "/criminal-defence",
    "/criminal-law",
    "/crime",
    "/crime-team",
    "/police-station",
    "/police-station-advice",
    "/legal-aid",
]

CRIME_PATH_MARKERS = ("crime", "criminal", "police-station", "legal-aid", "duty")


@dataclass
class CrawlResult:
    url: str
    status_code: int
    html: str
    success: bool
    error: str | None
    on_crime_page: bool


def registrable_domain(url: str) -> str:
    ext = tldextract.extract(url)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}"
    return ""


def _hostname_labels_valid(hostname: str) -> bool:
    if not hostname or len(hostname) > 253:
        return False
    labels = hostname.split(".")
    if len(labels) < 2:
        return False
    return all(_DNS_LABEL_RE.match(label) is not None for label in labels)


def normalize_website_url(raw: str | None) -> str | None:
    """Sanitize a firm website value into a crawlable http(s) URL, or None if unusable.

    Rejects HTML-contaminated values (entities, encoded quotes) rather than salvaging
    a host from garbage — those fields are not trustworthy website URLs.
    """
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None
    if _HTML_ENTITY_RE.search(text) or _URL_CONTAMINATION_RE.search(text):
        return None

    text = html.unescape(text)
    text = _UNICODE_SPACE_RE.sub(" ", text).strip()
    text = text.strip("'\"“”‘’«»").strip()
    if not text:
        return None
    text = text.split(" ", 1)[0].rstrip(".,;:'\")%>]")
    if not text:
        return None
    if "://" in text:
        if not text.startswith(("http://", "https://")):
            return None
    else:
        text = f"https://{text}"

    parsed = urlparse(text)
    if parsed.scheme not in ("http", "https"):
        return None
    if not parsed.netloc or "@" in parsed.netloc:
        return None
    hostname = parsed.hostname
    if not hostname or not _hostname_labels_valid(hostname):
        return None

    # Keep scheme + host (+ optional port); drop userinfo/query/fragment noise.
    netloc = parsed.netloc.lower()
    path = parsed.path if parsed.path and parsed.path != "/" else ""
    cleaned = urlunparse((parsed.scheme, netloc, path, "", "", ""))
    if not registrable_domain(cleaned):
        return None
    return cleaned


def can_fetch(rp: RobotFileParser | None, url: str, user_agent: str) -> bool:
    if rp is None:
        return True
    try:
        return rp.can_fetch(user_agent, url)
    except Exception:
        return True


def load_robots(base_url: str, user_agent: str) -> RobotFileParser | None:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
        return rp
    except Exception:
        return None


def crawl_firm_website(cfg: EngineConfig, db: Database, firm_id: int, website: str) -> list[CrawlResult]:
    normalized = normalize_website_url(website)
    if not normalized:
        raise ValueError(f"invalid website URL: {website!r}")

    website = normalized
    domain = registrable_domain(website)
    rp = load_robots(website, cfg.user_agent)
    session = requests.Session()
    session.headers.update({"User-Agent": cfg.user_agent, "Accept": "text/html"})

    results: list[CrawlResult] = []
    visited: set[str] = set()

    def fetch_path(path: str, depth: int, on_crime: bool) -> None:
        if len(visited) >= cfg.max_pages_per_domain or depth > cfg.max_crawl_depth:
            return
        url = urljoin(website, path)
        if url in visited:
            return
        visited.add(url)

        if not can_fetch(rp, url, cfg.user_agent):
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, url, 0, utc_now(), 0, "robots.txt disallowed"),
            )
            return

        time.sleep(cfg.crawl_delay_seconds)
        try:
            res = session.get(url, timeout=12, allow_redirects=True)
            page_html = res.text if "text/html" in (res.headers.get("content-type") or "") else ""
            ok = res.ok and bool(page_html)
            results.append(
                CrawlResult(
                    url=res.url,
                    status_code=res.status_code,
                    html=page_html,
                    success=ok,
                    error=None if ok else f"status {res.status_code}",
                    on_crime_page=on_crime or any(m in res.url.lower() for m in CRIME_PATH_MARKERS),
                )
            )
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, res.url, res.status_code, utc_now(), 1 if ok else 0, None if ok else f"status {res.status_code}"),
            )
            # Depth 2: follow internal links that look like team/crime pages
            if ok and depth < cfg.max_crawl_depth:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(page_html, "lxml")
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if not href.startswith("/") and domain not in href:
                        continue
                    hl = href.lower()
                    if any(m in hl for m in ("team", "people", "solicitor", "crime", "criminal", "police")):
                        fetch_path(href, depth + 1, True)
        except (requests.RequestException, ValueError, OSError) as e:
            # ValueError covers urllib3 LocationParseError (invalid host labels).
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, url, 0, utc_now(), 0, str(e)[:500]),
            )
            results.append(CrawlResult(url=url, status_code=0, html="", success=False, error=str(e), on_crime_page=False))

    for path in CRAWL_PATHS:
        on_crime = any(m in path for m in CRIME_PATH_MARKERS)
        fetch_path(path, 0, on_crime)

    db.execute("UPDATE firms SET last_checked_at = ? WHERE id = ?", (utc_now(), firm_id))
    return results
