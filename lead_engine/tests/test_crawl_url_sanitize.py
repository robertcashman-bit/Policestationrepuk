from __future__ import annotations

import os
import tempfile
from unittest.mock import patch

from src.config import load_config
from src.crawler import normalize_website_url
from src.database import Database
from src.pipeline import cmd_crawl


def test_normalize_rejects_html_garbage_kentonline():
    """Regression: HTML-contaminated website fields must not become crawl targets."""
    garbage = "www.kentonline.co.uk&nbsp;...%22"
    assert normalize_website_url(garbage) is None


def test_normalize_accepts_clean_urls():
    assert normalize_website_url("https://example-firm.co.uk/") == "https://example-firm.co.uk"
    assert normalize_website_url("www.example-firm.co.uk") == "https://www.example-firm.co.uk"
    assert normalize_website_url('  "https://crime.example.co.uk/contact"  ') == (
        "https://crime.example.co.uk/contact"
    )


def test_normalize_rejects_invalid_hosts():
    assert normalize_website_url("") is None
    assert normalize_website_url(None) is None
    assert normalize_website_url("https://bad_host_with_underscore.example") is None
    assert normalize_website_url("ftp://example.co.uk") is None
    assert normalize_website_url("not a url at all") is None


def _insert_firm(db: Database, name: str, website: str | None) -> int:
    db.execute(
        """INSERT INTO firms (firm_name, website, domain, jurisdiction, jurisdiction_confidence,
           criminal_relevance_score, source_discovery_method, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (name, website, None, "england_wales", 0.9, 70, "test", "candidate", "t", "t"),
    )
    return db.fetchone("SELECT id FROM firms WHERE firm_name = ?", (name,))["id"]


def test_cmd_crawl_skips_garbage_url_without_failing():
    """One bad website must be skipped; the crawl batch must still complete."""
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "test.db")
        cfg = load_config()
        cfg.database_path = db_path
        cfg.crawl_delay_seconds = 0
        db = Database(db_path)
        _insert_firm(db, "Garbage Firm", "www.kentonline.co.uk&nbsp;...%22")
        good_id = _insert_firm(db, "Good Firm", "https://good-firm.example.co.uk")

        with patch("src.pipeline.crawl_firm_website") as mock_crawl:
            mock_crawl.return_value = []
            result = cmd_crawl(cfg, db, limit=10)

        assert result["firms_skipped"] == 1
        assert result["firms_crawled"] == 1
        assert mock_crawl.call_count == 1
        assert mock_crawl.call_args.args[2] == good_id
        assert mock_crawl.call_args.args[3] == "https://good-firm.example.co.uk"
