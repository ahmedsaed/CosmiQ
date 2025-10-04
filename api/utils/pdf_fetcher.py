from typing import List
import httpx
from bs4 import BeautifulSoup
from loguru import logger
from urllib.parse import urljoin, unquote

async def fetch_pdf_links(
    base_url: str = "http://server.ahmedsaed.me:9999/downloaded2/",
    limit: int = 10
) -> List[dict]:

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(base_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            pdf_links = []
            
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.endswith('.pdf'):
                    if len(pdf_links) >= limit:
                        break
                        
                    full_url = urljoin(base_url, href)
                    title = unquote(href.replace('.pdf', '').replace('_', ' ').replace('-', ' '))
                    
                    pdf_links.append({
                        'url': full_url,
                        'title': title.strip()
                    })
            
            logger.info(f"Found {len(pdf_links)} PDF files (limited to {limit})")
            return pdf_links
            
    except Exception as e:
        logger.error(f"Error fetching PDF links: {str(e)}")
        return []