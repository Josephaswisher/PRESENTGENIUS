"""
UpToDate/Medical Scraper Service for VibePresenterPro Lecture Composer

A FastAPI microservice that provides:
1. UpToDate article scraping (with login)
2. MKSAP content scraping
3. Perplexity medical search
4. Tavily/Exa search integration
5. PubMed search

Run with: uvicorn scraper_service:app --port 8765 --reload
"""

import os
import time
import random
import asyncio
from typing import Optional, List, Dict, Any
from functools import wraps
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import Playwright (optional - for full scraping)
try:
    from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("⚠️ Playwright not installed. Full scraping disabled. Install with: pip install playwright && playwright install chromium")

# Try to import BeautifulSoup and html2text
try:
    from bs4 import BeautifulSoup
    import html2text
    SCRAPING_LIBS_AVAILABLE = True
except ImportError:
    SCRAPING_LIBS_AVAILABLE = False
    print("⚠️ BeautifulSoup/html2text not installed. Install with: pip install beautifulsoup4 html2text")


# =============================================
# MODELS
# =============================================

class SearchRequest(BaseModel):
    query: str
    max_results: int = 5
    include_domains: Optional[List[str]] = None
    perplexity_model: str = "sonar-pro"  # sonar-pro, sonar-reasoning-pro, sonar-deep-research

class ScrapeRequest(BaseModel):
    url: str
    use_login: bool = False
    extract_related: bool = False

class LoginCredentials(BaseModel):
    username: str
    password: str
    target: str = "uptodate"  # uptodate, mksap

class Citation(BaseModel):
    id: str
    title: str
    authors: Optional[List[str]] = None
    source: str
    year: Optional[int] = None
    url: Optional[str] = None
    pmid: Optional[str] = None
    snippet: Optional[str] = None

class SearchResponse(BaseModel):
    provider: str
    query: str
    content: str
    citations: List[Citation]
    timestamp: int


# =============================================
# CONFIGURATION
# =============================================

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]

MEDICAL_DOMAINS = [
    "ncbi.nlm.nih.gov",
    "pubmed.ncbi.nlm.nih.gov", 
    "uptodate.com",
    "nejm.org",
    "jamanetwork.com",
    "thelancet.com",
    "cochrane.org",
    "mayoclinic.org",
    "acponline.org",
]


# =============================================
# SCRAPER CLASS
# =============================================

class MedicalScraper:
    def __init__(self):
        self.browser = None
        self.context = None
        self.page = None
        self.logged_in_uptodate = False
        self.logged_in_mksap = False
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def start_browser(self, headless: bool = True):
        """Start Playwright browser if available."""
        if not PLAYWRIGHT_AVAILABLE:
            return False
        
        if self.browser:
            return True
            
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=["--disable-blink-features=AutomationControlled"]
            )
            self.context = await self.browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1920, "height": 1080},
                locale="en-US"
            )
            self.page = await self.context.new_page()
            return True
        except Exception as e:
            print(f"Failed to start browser: {e}")
            return False
    
    async def stop_browser(self):
        """Stop Playwright browser."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if hasattr(self, 'playwright') and self.playwright:
            await self.playwright.stop()
        self.browser = None
        self.context = None
        self.page = None
    
    def html_to_markdown(self, html_content: str) -> str:
        """Convert HTML to Markdown."""
        if not SCRAPING_LIBS_AVAILABLE:
            return html_content
        
        converter = html2text.HTML2Text()
        converter.ignore_links = False
        converter.ignore_images = False
        converter.ignore_tables = False
        converter.body_width = 0
        return converter.handle(html_content)
    
    async def login_uptodate(self, username: str, password: str) -> bool:
        """Login to UpToDate."""
        if not await self.start_browser():
            return False
        
        try:
            login_url = "https://www.uptodate.com/login"
            await self.page.goto(login_url)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # Check for "Sign in Another Way" button
            sign_in_another = self.page.locator('button#signInAnotherWayBtn')
            if await sign_in_another.is_visible():
                await sign_in_another.click()
                await asyncio.sleep(2)
            
            # Fill username
            await self.page.wait_for_selector("input#userName", timeout=15000)
            await self.page.fill("input#userName", username)
            await self.page.press("input#userName", "Enter")
            await asyncio.sleep(3)
            
            # Fill password
            await self.page.wait_for_selector("input#password", timeout=15000)
            await self.page.fill("input#password", password)
            await self.page.press("input#password", "Enter")
            
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)
            
            self.logged_in_uptodate = True
            return True
        except Exception as e:
            print(f"UpToDate login failed: {e}")
            return False
    
    async def login_mksap(self, username: str, password: str) -> bool:
        """Login to ACP/MKSAP 19."""
        if not await self.start_browser():
            return False
        
        try:
            # MKSAP 19 login page
            login_url = "https://mksap19.acponline.org/"
            await self.page.goto(login_url)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # MKSAP uses ACP SSO - look for login form or redirect
            # Try common selectors for username/password
            username_selectors = [
                "input[name='username']",
                "input[id='username']", 
                "input[name='email']",
                "input[id='email']",
                "input[type='email']",
                "input[name*='sername']",
                "input[id*='sername']"
            ]
            password_selectors = [
                "input[name='password']",
                "input[id='password']",
                "input[type='password']",
                "input[name*='assword']",
                "input[id*='assword']"
            ]
            
            # Find and fill username
            for selector in username_selectors:
                try:
                    if await self.page.locator(selector).count() > 0:
                        await self.page.fill(selector, username)
                        break
                except:
                    continue
            
            # Find and fill password
            for selector in password_selectors:
                try:
                    if await self.page.locator(selector).count() > 0:
                        await self.page.fill(selector, password)
                        break
                except:
                    continue
            
            # Click submit
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button:has-text('Sign In')",
                "button:has-text('Log In')",
                "button:has-text('Login')"
            ]
            
            for selector in submit_selectors:
                try:
                    if await self.page.locator(selector).count() > 0:
                        await self.page.click(selector)
                        break
                except:
                    continue
            
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)
            
            # Check if login succeeded by looking for logged-in indicators
            current_url = self.page.url
            if "mksap19" in current_url or "dashboard" in current_url.lower():
                self.logged_in_mksap = True
                return True
            
            self.logged_in_mksap = True  # Assume success if no error
            return True
        except Exception as e:
            print(f"MKSAP login failed: {e}")
            return False
    
    async def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrape a URL and return markdown content."""
        if not await self.start_browser():
            raise HTTPException(status_code=500, detail="Browser not available")
        
        try:
            # Random delay for stealth
            await asyncio.sleep(random.uniform(1, 3))
            
            await self.page.goto(url)
            await self.page.wait_for_load_state('domcontentloaded')
            await asyncio.sleep(2)
            
            content_html = await self.page.content()
            soup = BeautifulSoup(content_html, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
                element.decompose()
            
            # Extract title
            title = ""
            h1 = soup.find('h1')
            if h1:
                title = h1.get_text(strip=True)
            elif soup.title:
                title = soup.title.string or ""
            
            # Convert to markdown
            markdown = self.html_to_markdown(str(soup))
            
            # Extract citations/references if present
            citations = []
            refs = soup.find_all(['cite', 'a'], class_=lambda x: x and 'reference' in x.lower() if x else False)
            for i, ref in enumerate(refs[:20]):
                citations.append({
                    "id": f"ref-{i}",
                    "title": ref.get_text(strip=True)[:200],
                    "source": url,
                    "url": ref.get('href', '')
                })
            
            return {
                "title": title,
                "content": markdown,
                "citations": citations,
                "url": url
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")
    
    async def search_perplexity(
        self, 
        query: str, 
        medical_focus: bool = True,
        model: str = "sonar-pro"
    ) -> SearchResponse:
        """Search using Perplexity API.
        
        Args:
            model: One of 'sonar-pro', 'sonar-reasoning-pro', 'sonar-deep-research'
        """
        api_key = os.getenv("PERPLEXITY_API_KEY") or os.getenv("VITE_PERPLEXITY_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="PERPLEXITY_API_KEY not configured")
        
        # Model-specific system prompts
        system_prompts = {
            "sonar-pro": (
                "You are a medical education researcher. Provide comprehensive, evidence-based information "
                "with specific citations. Focus on current guidelines, landmark studies, and clinical pearls. "
                "Always cite sources with author, year, and journal/guideline name."
            ) if medical_focus else "You are a helpful research assistant.",
            "sonar-reasoning-pro": (
                "You are an expert clinical educator. Think through this medical topic step-by-step, "
                "explaining your clinical reasoning. Consider differential diagnoses, pathophysiology, "
                "and evidence-based management. Cite guidelines and landmark trials. Show your reasoning process."
            ) if medical_focus else "You are an analytical researcher. Think step-by-step and show your reasoning.",
            "sonar-deep-research": (
                "You are a medical literature researcher conducting an exhaustive review. Synthesize "
                "information from multiple high-quality sources including guidelines, systematic reviews, "
                "and landmark trials. Provide a comprehensive analysis with extensive citations."
            ) if medical_focus else "Conduct exhaustive research and provide comprehensive synthesis.",
        }
        
        system_prompt = system_prompts.get(model, system_prompts["sonar-pro"])
        temperature = 0.1 if model == "sonar-reasoning-pro" else 0.2
        
        try:
            response = await self.http_client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query}
                    ],
                    "temperature": temperature,
                    "return_citations": True,
                    "search_domain_filter": MEDICAL_DOMAINS if medical_focus else None
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Perplexity API error")
            
            data = response.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            raw_citations = data.get("citations", [])
            
            citations = [
                Citation(
                    id=f"pplx-{i}",
                    title=c if isinstance(c, str) else c.get("title", f"Source {i+1}"),
                    source="Perplexity",
                    url=c if isinstance(c, str) else c.get("url", "")
                )
                for i, c in enumerate(raw_citations)
            ]
            
            return SearchResponse(
                provider="perplexity",
                query=query,
                content=content,
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Perplexity request failed: {str(e)}")
    
    async def search_exa(self, query: str, max_results: int = 10) -> SearchResponse:
        """Search using Exa API."""
        api_key = os.getenv("EXA_API_KEY") or os.getenv("VITE_EXA_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="EXA_API_KEY not configured")
        
        try:
            response = await self.http_client.post(
                "https://api.exa.ai/search",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "query": f"medical education {query}",
                    "numResults": max_results,
                    "useAutoprompt": True,
                    "type": "neural",
                    "contents": {
                        "text": {"maxCharacters": 2000},
                        "highlights": {"numSentences": 3}
                    },
                    "includeDomains": MEDICAL_DOMAINS
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Exa API error")
            
            data = response.json()
            results = data.get("results", [])
            
            citations = [
                Citation(
                    id=f"exa-{i}",
                    title=r.get("title", "Untitled"),
                    source=r.get("url", "").split("/")[2] if r.get("url") else "Exa",
                    url=r.get("url", ""),
                    snippet=r.get("highlights", [""])[0] if r.get("highlights") else r.get("text", "")[:300]
                )
                for i, r in enumerate(results)
            ]
            
            # Combine content
            content = "\n\n---\n\n".join([
                f"## {r.get('title', 'Untitled')}\n{r.get('text', r.get('highlights', [''])[0] if r.get('highlights') else '')}"
                for r in results
            ])
            
            return SearchResponse(
                provider="exa",
                query=query,
                content=content,
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Exa request failed: {str(e)}")
    
    async def search_tavily(self, query: str, max_results: int = 10) -> SearchResponse:
        """Search using Tavily API."""
        api_key = os.getenv("TAVILY_API_KEY") or os.getenv("VITE_TAVILY_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="TAVILY_API_KEY not configured")
        
        try:
            response = await self.http_client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": api_key,
                    "query": f"{query} medical guidelines evidence-based",
                    "search_depth": "advanced",
                    "include_domains": MEDICAL_DOMAINS,
                    "max_results": max_results,
                    "include_answer": True
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Tavily API error")
            
            data = response.json()
            results = data.get("results", [])
            answer = data.get("answer", "")
            
            citations = [
                Citation(
                    id=f"tavily-{i}",
                    title=r.get("title", "Untitled"),
                    source=r.get("url", "").split("/")[2] if r.get("url") else "Tavily",
                    url=r.get("url", ""),
                    snippet=r.get("content", "")[:300]
                )
                for i, r in enumerate(results)
            ]
            
            return SearchResponse(
                provider="tavily",
                query=query,
                content=answer,
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Tavily request failed: {str(e)}")
    
    async def search_uptodate(self, query: str, max_results: int = 5) -> SearchResponse:
        """Search UpToDate internal search (requires login)."""
        if not self.logged_in_uptodate:
            raise HTTPException(status_code=401, detail="Not logged into UpToDate. Please login first.")
        
        if not await self.start_browser():
            raise HTTPException(status_code=500, detail="Browser not available")
        
        try:
            # Navigate to UpToDate search
            search_url = f"https://www.uptodate.com/contents/search?search={query.replace(' ', '+')}&source=SEARCH_RESULT"
            await self.page.goto(search_url)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            # Get search results
            content_html = await self.page.content()
            soup = BeautifulSoup(content_html, 'html.parser')
            
            citations = []
            content_parts = []
            
            # Find search result items (UpToDate uses various class names)
            result_selectors = [
                "div[class*='search-result']",
                "div[class*='result-item']",
                "a[class*='search-result']",
                "li[class*='search-result']",
            ]
            
            results = []
            for selector in result_selectors:
                results = soup.select(selector)
                if results:
                    break
            
            # If no results via CSS, try finding links to content
            if not results:
                results = soup.find_all('a', href=lambda x: x and '/contents/' in x)[:max_results]
            
            for i, result in enumerate(results[:max_results]):
                title_elem = result.find(['h2', 'h3', 'a', 'span'])
                title = title_elem.get_text(strip=True) if title_elem else f"UpToDate Result {i+1}"
                
                link = result.get('href', '') if result.name == 'a' else result.find('a', href=True)
                url = link if isinstance(link, str) else (link.get('href', '') if link else '')
                if url and not url.startswith('http'):
                    url = f"https://www.uptodate.com{url}"
                
                snippet = result.get_text(strip=True)[:300] if result else ""
                
                citations.append(Citation(
                    id=f"uptodate-{i}",
                    title=title[:200],
                    source="UpToDate",
                    url=url,
                    snippet=snippet
                ))
                content_parts.append(f"**{title}**\n{snippet}")
            
            # If we got results, try to get content from first result
            first_content = ""
            if citations and citations[0].url:
                try:
                    await self.page.goto(citations[0].url)
                    await self.page.wait_for_load_state('networkidle')
                    await asyncio.sleep(2)
                    
                    article_html = await self.page.content()
                    article_soup = BeautifulSoup(article_html, 'html.parser')
                    
                    # Find main content area
                    main_content = article_soup.find('div', class_=lambda x: x and 'topic-content' in x.lower() if x else False)
                    if not main_content:
                        main_content = article_soup.find('article')
                    if not main_content:
                        main_content = article_soup.find('main')
                    
                    if main_content:
                        first_content = self.html_to_markdown(str(main_content))[:8000]
                except Exception as e:
                    print(f"Failed to fetch UpToDate article content: {e}")
            
            combined_content = first_content if first_content else "\n\n---\n\n".join(content_parts)
            
            return SearchResponse(
                provider="uptodate",
                query=query,
                content=combined_content,
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"UpToDate search failed: {str(e)}")
    
    async def search_mksap(self, query: str, max_results: int = 5) -> SearchResponse:
        """Search MKSAP 19 internal search (requires login)."""
        if not self.logged_in_mksap:
            raise HTTPException(status_code=401, detail="Not logged into MKSAP. Please login first.")
        
        if not await self.start_browser():
            raise HTTPException(status_code=500, detail="Browser not available")
        
        try:
            # Navigate to MKSAP search - adjust URL based on actual MKSAP interface
            search_url = f"https://mksap19.acponline.org/search?q={query.replace(' ', '+')}"
            await self.page.goto(search_url)
            await self.page.wait_for_load_state('networkidle')
            await asyncio.sleep(2)
            
            content_html = await self.page.content()
            soup = BeautifulSoup(content_html, 'html.parser')
            
            citations = []
            content_parts = []
            
            # Find search results
            results = soup.find_all('a', href=lambda x: x and ('section' in x.lower() or 'chapter' in x.lower() or 'question' in x.lower()))[:max_results]
            
            for i, result in enumerate(results):
                title = result.get_text(strip=True)[:200]
                url = result.get('href', '')
                if url and not url.startswith('http'):
                    url = f"https://mksap19.acponline.org{url}"
                
                parent = result.find_parent(['div', 'li', 'article'])
                snippet = parent.get_text(strip=True)[:300] if parent else title
                
                citations.append(Citation(
                    id=f"mksap-{i}",
                    title=title,
                    source="MKSAP 19",
                    url=url,
                    snippet=snippet
                ))
                content_parts.append(f"**{title}**\n{snippet}")
            
            return SearchResponse(
                provider="mksap",
                query=query,
                content="\n\n---\n\n".join(content_parts),
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"MKSAP search failed: {str(e)}")
    
    async def search_pubmed(self, query: str, max_results: int = 10) -> SearchResponse:
        """Search PubMed using NCBI E-utilities (no API key required)."""
        try:
            # Search for IDs
            search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
            search_response = await self.http_client.get(
                search_url,
                params={
                    "db": "pubmed",
                    "term": query,
                    "retmax": max_results,
                    "retmode": "json"
                }
            )
            
            search_data = search_response.json()
            ids = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not ids:
                return SearchResponse(
                    provider="pubmed",
                    query=query,
                    content="No results found.",
                    citations=[],
                    timestamp=int(time.time() * 1000)
                )
            
            # Fetch details
            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            fetch_response = await self.http_client.get(
                fetch_url,
                params={
                    "db": "pubmed",
                    "id": ",".join(ids),
                    "retmode": "json"
                }
            )
            
            fetch_data = fetch_response.json()
            result_data = fetch_data.get("result", {})
            
            citations = []
            content_parts = []
            
            for pmid in ids:
                article = result_data.get(pmid, {})
                if article and isinstance(article, dict):
                    title = article.get("title", "Untitled")
                    authors = [a.get("name", "") for a in article.get("authors", [])[:3]]
                    source = article.get("source", "")
                    pubdate = article.get("pubdate", "")
                    
                    citations.append(Citation(
                        id=f"pubmed-{pmid}",
                        title=title,
                        authors=authors,
                        source=source,
                        year=int(pubdate.split()[0]) if pubdate and pubdate.split()[0].isdigit() else None,
                        pmid=pmid,
                        url=f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    ))
                    
                    author_str = ", ".join(authors) + " et al." if authors else ""
                    content_parts.append(f"**{title}**\n{author_str} - {source} ({pubdate})")
            
            return SearchResponse(
                provider="pubmed",
                query=query,
                content="\n\n".join(content_parts),
                citations=citations,
                timestamp=int(time.time() * 1000)
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PubMed search failed: {str(e)}")


# =============================================
# FASTAPI APP
# =============================================

scraper = MedicalScraper()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    yield
    # Cleanup on shutdown
    await scraper.stop_browser()
    await scraper.http_client.aclose()

app = FastAPI(
    title="VibePresenterPro Medical Scraper",
    description="Medical content scraper for Lecture Composer",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================
# ENDPOINTS
# =============================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "playwright_available": PLAYWRIGHT_AVAILABLE,
        "scraping_libs_available": SCRAPING_LIBS_AVAILABLE,
        "uptodate_logged_in": scraper.logged_in_uptodate,
        "mksap_logged_in": scraper.logged_in_mksap
    }

@app.post("/login")
async def login(credentials: LoginCredentials):
    """Login to medical resources."""
    if credentials.target == "uptodate":
        success = await scraper.login_uptodate(credentials.username, credentials.password)
    elif credentials.target == "mksap":
        success = await scraper.login_mksap(credentials.username, credentials.password)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown target: {credentials.target}")
    
    if not success:
        raise HTTPException(status_code=401, detail="Login failed")
    
    return {"status": "logged_in", "target": credentials.target}

@app.post("/scrape")
async def scrape(request: ScrapeRequest):
    """Scrape a URL."""
    result = await scraper.scrape_url(request.url)
    return result

@app.post("/search/perplexity", response_model=SearchResponse)
async def search_perplexity(request: SearchRequest):
    """Search using Perplexity."""
    return await scraper.search_perplexity(request.query, model=request.perplexity_model)

@app.post("/search/exa", response_model=SearchResponse)
async def search_exa(request: SearchRequest):
    """Search using Exa."""
    return await scraper.search_exa(request.query, request.max_results)

@app.post("/search/tavily", response_model=SearchResponse)
async def search_tavily(request: SearchRequest):
    """Search using Tavily."""
    return await scraper.search_tavily(request.query, request.max_results)

@app.post("/search/pubmed", response_model=SearchResponse)
async def search_pubmed(request: SearchRequest):
    """Search PubMed."""
    return await scraper.search_pubmed(request.query, request.max_results)

@app.post("/search/uptodate", response_model=SearchResponse)
async def search_uptodate(request: SearchRequest):
    """Search UpToDate (requires prior login)."""
    return await scraper.search_uptodate(request.query, request.max_results)

@app.post("/search/mksap", response_model=SearchResponse)
async def search_mksap(request: SearchRequest):
    """Search MKSAP 19 (requires prior login)."""
    return await scraper.search_mksap(request.query, request.max_results)

@app.post("/search/aggregate")
async def aggregate_search(request: SearchRequest):
    """
    Aggregate search across multiple providers.
    Returns combined results from available sources.
    """
    results = {}
    errors = {}
    
    # Run searches in parallel
    tasks = []
    
    # Always try PubMed (no API key needed)
    tasks.append(("pubmed", scraper.search_pubmed(request.query, request.max_results)))
    
    # Try other providers if keys are available
    if os.getenv("PERPLEXITY_API_KEY") or os.getenv("VITE_PERPLEXITY_API_KEY"):
        tasks.append(("perplexity", scraper.search_perplexity(request.query, model=request.perplexity_model)))
    
    if os.getenv("EXA_API_KEY") or os.getenv("VITE_EXA_API_KEY"):
        tasks.append(("exa", scraper.search_exa(request.query, request.max_results)))
    
    if os.getenv("TAVILY_API_KEY") or os.getenv("VITE_TAVILY_API_KEY"):
        tasks.append(("tavily", scraper.search_tavily(request.query, request.max_results)))
    
    # Execute all tasks
    for provider, task in tasks:
        try:
            result = await task
            results[provider] = result.model_dump()
        except Exception as e:
            errors[provider] = str(e)
    
    # Combine all citations
    all_citations = []
    all_content = []
    
    for provider, data in results.items():
        all_citations.extend(data.get("citations", []))
        if data.get("content"):
            all_content.append(f"## From {provider.title()}\n\n{data['content']}")
    
    return {
        "query": request.query,
        "sources": results,
        "errors": errors,
        "combined_content": "\n\n---\n\n".join(all_content),
        "all_citations": all_citations,
        "timestamp": int(time.time() * 1000)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)
