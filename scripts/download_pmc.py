#!/usr/bin/env python3
"""PMC downloader: Playwright PDF rendering (optional) + requests->Markdown fallback.

Clean, single-file implementation. It reads the CSV listed by --csv and produces
one folder per article under --out containing either a PDF (when --pdf-with-playwright
is used and succeeds) or a Markdown file + images.

Usage:
    python3 scripts/download_pmc.py --csv data/SB_publication_PMC.csv --out downloaded --n 10 --delay 0.1 --pdf-with-playwright
"""
from __future__ import annotations

import argparse
import base64
import csv
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except Exception:
    PLAYWRIGHT_AVAILABLE = False


@dataclass
class DownloadOptions:
    csv_path: Path
    out_root: Path
    n: int
    delay: float
    timeout: int
    prefer: str
    pdf_with_playwright: bool


class PMCDownloader:
    def __init__(self, opts: DownloadOptions):
        self.opts = opts
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Mozilla/5.0 (compatible; CosmiQ-bot/1.0)"})
        retries = Retry(total=5, backoff_factor=0.5, status_forcelist=(429, 500, 502, 503, 504))
        adapter = HTTPAdapter(max_retries=retries)
        self.session.mount("https://", adapter)
        self.session.mount("http://", adapter)
        # Playwright handles (initialized in run if requested)
        self._pw = None
        self._browser = None

    @staticmethod
    def slugify(s: str) -> str:
        s = (s or "").strip()
        s = re.sub(r"[\\/:*?\"<>|]+", "", s)
        s = re.sub(r"\s+", "-", s)
        return s[:200]

    @staticmethod
    def ensure_dir(p: Path):
        p.mkdir(parents=True, exist_ok=True)

    def download_file(self, url: str, dest: Path, timeout: int = 30, retries: int = 3):
        last_exc = None
        for attempt in range(1, retries + 1):
            try:
                resp = self.session.get(url, stream=True, timeout=timeout)
                resp.raise_for_status()
                with open(dest, "wb") as f:
                    for chunk in resp.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                return dest
            except Exception as e:
                last_exc = e
                print(f"Warning: download attempt {attempt} failed for {url}: {e}")
                time.sleep(1 * attempt)
        raise last_exc

    def html_to_markdown_and_images(self, html: str, base_url: str, out_dir: Path) -> str:
        soup = BeautifulSoup(html, "html.parser")
        article = None
        for sel in ["article", "div#maincontent", "div#main-content", "div.article", "div#article"]:
            article = soup.select_one(sel)
            if article:
                break
        if not article:
            article = soup.select_one("div#main") or soup.body or soup

        # Download images and rewrite src to local images/
        for img in article.find_all("img"):
            src = img.get("src") or img.get("data-src") or img.get("data-original")
            if not src:
                continue
            img_url = urljoin(base_url, src)
            try:
                img_name = self.slugify(Path(urlparse(img_url).path).name) or "image"
                img_path = out_dir / "images" / img_name
                self.ensure_dir(img_path.parent)
                self.download_file(img_url, img_path)
                img["src"] = f"images/{img_path.name}"
            except Exception as e:
                print(f"Warning: failed to download image {img_url}: {e}")

        # Convert to markdown
        try:
            from markdownify import markdownify as md

            md_text = md(str(article), heading_style="ATX")
        except Exception:
            md_text = article.get_text("\n")

        return md_text

    def render_pdf_with_playwright(self, link: str, title: str) -> Optional[Path]:
        if not PLAYWRIGHT_AVAILABLE:
            print("Playwright is not available in this environment.")
            return None

        safe_title = self.slugify(title or urlparse(link).path.replace("/", "-"))
        out_dir = self.opts.out_root / safe_title
        self.ensure_dir(out_dir)
        target_pdf = out_dir / f"{safe_title}.pdf"

        temp_browser = False
        page = None
        browser = None
        pw_ctx = None
        try:
            if self._browser:
                browser = self._browser
                page = browser.new_page()
            else:
                # create temporary playwright context and browser
                pw_ctx = sync_playwright().start()
                browser = pw_ctx.chromium.launch(headless=True)
                temp_browser = True
                page = browser.new_page()

            print(f"Playwright: opening page for '{title}' -> {link}")
            page.goto(link, wait_until="networkidle")
            # short wait to let page JS run (user can tune)
            # page.wait_for_timeout(100)

            # Populate data-src lazy images and try to embed images as data URIs
            try:
                page.evaluate("""
                () => {
                  document.querySelectorAll('img').forEach(img => {
                    const d = img.dataset || {};
                    if (!img.src || img.src.trim() === '') {
                      if (d.src) img.src = d.src;
                      else if (d.original) img.src = d.original;
                      else if (d.lazy) img.src = d.lazy;
                      else if (img.getAttribute('data-src')) img.src = img.getAttribute('data-src');
                    }
                  });
                }
                """)

                # Scroll to trigger lazy loaders
                height = page.evaluate("() => document.body.scrollHeight")
                step = 800
                pos = 0
                while pos < height:
                    page.evaluate("window.scrollTo(0, %d);" % pos)
                    # page.wait_for_timeout(100)
                    pos += step

                # page.wait_for_timeout(100)

                # Fetch images and embed as data URIs where possible
                imgs = page.query_selector_all('img')
                for ih in imgs:
                    try:
                        src = ih.get_attribute('src') or ''
                        if not src or src.startswith('data:'):
                            continue
                        src_abs = urljoin(link, src)
                        resp_img = page.request.get(src_abs)
                        ctype = resp_img.headers.get('content-type', '')
                        if resp_img.ok and ctype.startswith('image'):
                            b64 = base64.b64encode(resp_img.body()).decode('ascii')
                            datauri = f"data:{ctype};base64,{b64}"
                            ih.evaluate("(img, data) => { img.src = data; }", datauri)
                    except Exception:
                        pass
            except Exception:
                pass

            # Render to PDF including backgrounds
            try:
                page.pdf(path=str(target_pdf), print_background=True, prefer_css_page_size=True)
            except Exception as e:
                print(f"Playwright: page.pdf failed for '{title}' on first attempt: {e}")
                raise
            try:
                page.close()
            except Exception:
                pass
            if temp_browser:
                try:
                    browser.close()
                except Exception:
                    pass
                try:
                    pw_ctx.stop()
                except Exception:
                    pass
            print(f"Playwright: saved PDF for '{title}' -> {target_pdf}")
            return target_pdf
        except Exception as e:
            print(f"Playwright PDF rendering failed for {link}: {e}")
            # Try one more time with a fresh temporary browser and longer waits
            try:
                print(f"Playwright: retrying rendering for '{title}' with a fresh browser...")
                pw_ctx = sync_playwright().start()
                browser2 = pw_ctx.chromium.launch(headless=True)
                page2 = browser2.new_page()
                page2.goto(link, wait_until="networkidle")
                # page2.wait_for_timeout(100)
                # attempt the same embedding steps
                try:
                    page2.evaluate("""
                    () => {
                      document.querySelectorAll('img').forEach(img => {
                        const d = img.dataset || {};
                        if (!img.src || img.src.trim() === '') {
                          if (d.src) img.src = d.src;
                          else if (d.original) img.src = d.original;
                          else if (d.lazy) img.src = d.lazy;
                          else if (img.getAttribute('data-src')) img.src = img.getAttribute('data-src');
                        }
                      });
                    }
                    """)
                except Exception:
                    pass
                try:
                    page2.pdf(path=str(target_pdf), print_background=True, prefer_css_page_size=True)
                    print(f"Playwright: retry saved PDF for '{title}' -> {target_pdf}")
                    try:
                        page2.close()
                    except Exception:
                        pass
                    try:
                        browser2.close()
                    except Exception:
                        pass
                    try:
                        pw_ctx.stop()
                    except Exception:
                        pass
                    return target_pdf
                except Exception as e2:
                    print(f"Playwright retry failed for {link}: {e2}")
                    try:
                        page2.close()
                    except Exception:
                        pass
                    try:
                        browser2.close()
                    except Exception:
                        pass
                    try:
                        pw_ctx.stop()
                    except Exception:
                        pass
            except Exception as e3:
                print(f"Playwright retry setup failed for {link}: {e3}")
            return None

    def process_row(self, title: str, link: str):
        safe_title = self.slugify(title or urlparse(link).path.replace("/", "-"))
        out_dir = self.opts.out_root / safe_title
        self.ensure_dir(out_dir)

        # Fetch page (requests) for markdown fallback
        try:
            resp = self.session.get(link, timeout=self.opts.timeout)
            resp.raise_for_status()
        except Exception as e:
            print(f"Error fetching {link}: {e}")
            return

        # If Playwright requested, try PDF rendering
        if self.opts.pdf_with_playwright:
            pdf_path = self.render_pdf_with_playwright(link, title)
            if pdf_path:
                print(f"Saved PDF: {pdf_path}")
                return

        # Markdown fallback
        print(f"Converting HTML to markdown for: {title}")
        md_text = self.html_to_markdown_and_images(resp.text, link, out_dir)
        md_file = out_dir / f"{safe_title}.md"
        with open(md_file, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n")
            f.write(md_text)
        print(f"Saved markdown: {md_file}")

    def run(self):
        # If Playwright rendering requested, initialize one browser instance to reuse across rows
        if self.opts.pdf_with_playwright and PLAYWRIGHT_AVAILABLE:
            try:
                self._pw = sync_playwright().start()
                self._browser = self._pw.chromium.launch(headless=True)
            except Exception as e:
                print(f"Warning: failed to start Playwright browser for reuse: {e}")
                self._pw = None
                self._browser = None

        with open(self.opts.csv_path, newline="", encoding="utf-8") as fh:
            reader = csv.reader(fh)
            header = next(reader)
            link_idx = 0
            for i, col in enumerate(header):
                if col.strip().lower() in ("link", "url", "href"):
                    link_idx = i
                    break

            title_idx = 0 if header else None

            count = 0
            for row in reader:
                if not row:
                    continue
                link = row[link_idx].strip()
                title = row[title_idx].strip() if title_idx is not None and len(row) > title_idx else link
                # If output directory exists and contains files, skip this article
                safe_title = self.slugify(title or urlparse(link).path.replace("/", "-"))
                out_dir = self.opts.out_root / safe_title
                if out_dir.exists() and any(out_dir.iterdir()):
                    print(f"Skipping {title} (output exists): {out_dir}")
                    count += 1
                    if self.opts.n and self.opts.n > 0 and count >= self.opts.n:
                        break
                    time.sleep(max(0, self.opts.delay))
                    continue

                try:
                    self.process_row(title, link)
                except Exception as e:
                    # Log error but continue processing other rows
                    print(f"Error processing {link}: {e}")
                count += 1
                if self.opts.n and self.opts.n > 0 and count >= self.opts.n:
                    break
                time.sleep(max(0, self.opts.delay))

        # Clean up Playwright browser if we started one
        if self._browser:
            try:
                self._browser.close()
            except Exception:
                pass
        if self._pw:
            try:
                self._pw.stop()
            except Exception:
                pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Download PMC articles from CSV (title,link)")
    parser.add_argument("--csv", required=True, help="Path to CSV file containing Title,Link")
    parser.add_argument("--out", dest="out_dir", default="output", help="Output root directory")
    parser.add_argument("-n", type=int, default=10, help="Number of articles to download (0 for all)")
    parser.add_argument("--delay", type=float, default=0.1, help="Delay between requests in seconds")
    parser.add_argument("--timeout", type=int, default=30, help="Request timeout seconds")
    parser.add_argument("--format", choices=("auto", "pdf", "md"), default="auto", help="Preferred output format")
    parser.add_argument("--pdf-with-playwright", action="store_true", help="If set, use Playwright to render PDFs (requires Playwright).")

    args = parser.parse_args()

    opts = DownloadOptions(
        csv_path=Path(args.csv),
        out_root=Path(args.out_dir),
        n=args.n,
        delay=args.delay,
        timeout=args.timeout,
        prefer=args.format,
        pdf_with_playwright=args.pdf_with_playwright,
    )

    downloader = PMCDownloader(opts)
    downloader.run()


if __name__ == "__main__":
    main()
