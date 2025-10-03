Download PMC articles listed in a CSV to PDF or Markdown

Usage example:

python3 scripts/download_pmc.py --csv data/SB_publication_PMC.csv --out downloaded --n 5 --delay 0.2 --format auto

Options:
- --csv: Path to CSV file (expects Title,Link columns)
- --out: Output directory (default: output)
- -n: Number of articles to download (0 = all; default 10)
- --delay: Seconds between requests (default 0.1)
- --format: auto|pdf|md — prefer PDF when available, or force markdown
- --pdf-with-playwright: Use Playwright to fetch PDFs when direct download returns the JS challenge (recommended for robust PDF retrieval)

Notes:
- The script prefers the PDF provided by PMC via the page meta tag `citation_pdf_url`. This preserves full formatting and images.
- If PDF is not available or the site returns a JS challenge, the script falls back to converting HTML to markdown and downloading inline images.

Playwright (recommended for true PDF downloads)
------------------------------------------------
Some PMC PDF links are protected by a JavaScript challenge; to fetch the real PDF you can use Playwright.

Locally:

- pip install -r scripts/requirements.txt
- python -m playwright install

Docker (recommended to avoid installing browsers locally):

Build the container:

docker build -f scripts/Dockerfile.playwright -t cosmiq-downloader:playwright .

Run the downloader inside the container (example):

docker run --rm -v "$(pwd)/data:/app/data" -v "$(pwd)/downloaded:/app/downloaded" cosmiq-downloader:playwright --csv data/SB_publication_PMC.csv --out downloaded -n 10 --pdf-with-playwright

Notes:
- The flag `--pdf-with-playwright` enables Playwright fallback when a direct PDF download fails due to the JS challenge.
- Playwright increases reliability for getting publisher PDFs but requires browser binaries (installed in the Docker image above).
Download PMC articles listed in a CSV to PDF or Markdown

Usage example:

python3 scripts/download_pmc.py --csv data/SB_publication_PMC.csv --out downloaded --n 5 --delay 0.2 --format auto

Options:
- --csv: Path to CSV file (expects Title,Link columns)
- --out: Output directory (default: output)
- -n: Number of articles to download (0 = all; default 10)
- --delay: Seconds between requests (default 0.1)
- --format: auto|pdf|md — prefer PDF when available, or force markdown

Notes:
- The script prefers the PDF provided by PMC via the page meta tag `citation_pdf_url`. This preserves full formatting and images.
- If PDF is not available or markdown is requested, the script converts HTML to markdown and downloads inline images into an images/ subfolder.
- Install dependencies: pip install -r scripts/requirements.txt
