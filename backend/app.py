import os
import re
import base64
import urllib.parse
import warnings
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

warnings.filterwarnings("ignore", category=RuntimeWarning, message=".*duckduckgo_search.*")

# Try importing duckduckgo_search safely
try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

app = FastAPI(
    title="Magpie Backend",
    description="Resilient agentic backend for the Magpie browser extension.",
    version="1.1.0"
)

# Allow extension to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AgentQuery(BaseModel):
    query: str
    base_url: str | None = None
    api_key: str = ""
    model_name: str = "llama3"
    include_page_context: bool = False
    page_url: str | None = None
    page_title: str | None = None
    page_content: str | None = None
    search_enabled: bool = True
    crawl_enabled: bool = False
    mode: str = "default"

@app.get("/")
@app.get("/health")
def read_root():
    return {
        "app": "Magpie",
        "status": "online",
        "version": "1.1.0",
        "docs": "/docs",
        "endpoint": "POST /api/agent"
    }

def decode_bing_url(href: str) -> str:
    """Decodes Bing click tracking URL to direct website URL."""
    try:
        if "bing.com/ck/a?" in href and "u=" in href:
            parsed = urllib.parse.urlparse(href)
            params = urllib.parse.parse_qs(parsed.query)
            u_val = params.get('u', [''])[0]
            if u_val.startswith('a1'):
                raw_b64 = u_val[2:]
                raw_b64 += '=' * (-len(raw_b64) % 4)
                decoded = base64.b64decode(raw_b64).decode('utf-8', errors='ignore')
                if decoded.startswith('http'):
                    return decoded
    except Exception:
        pass
    return href

def search_ddg_instant(query: str):
    """Searches DuckDuckGo Instant Answer API."""
    results = []
    try:
        url = "https://api.duckduckgo.com/"
        params = {'q': query, 'format': 'json', 'no_html': 1, 'skip_disambig': 1}
        resp = requests.get(url, params=params, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('AbstractText') and data.get('AbstractURL'):
                results.append({
                    'title': data.get('Heading', 'Summary'),
                    'href': data.get('AbstractURL'),
                    'snippet': data.get('AbstractText')
                })
            for topic in data.get('RelatedTopics', [])[:3]:
                if isinstance(topic, dict) and topic.get('Text') and topic.get('FirstURL'):
                    results.append({
                        'title': topic.get('Text', '')[:60],
                        'href': topic.get('FirstURL'),
                        'snippet': topic.get('Text')
                    })
    except Exception as e:
        print(f"[Magpie] DDG instant error: {e}")
    return results

def search_bing_html(query: str, max_results=4):
    """Fallback search using Bing HTML search."""
    results = []
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        encoded_query = urllib.parse.quote(query)
        resp = requests.get(f"https://www.bing.com/search?q={encoded_query}", headers=headers, timeout=5)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            for li in soup.select('li.b_algo'):
                h2 = li.find('h2')
                if h2:
                    a = h2.find('a')
                    if a and a.get('href'):
                        href = decode_bing_url(a.get('href'))
                        p = li.find('p')
                        snippet = p.get_text(strip=True) if p else ''
                        title = a.get_text(strip=True)
                        if href.startswith('http') and not href.startswith('https://www.bing.com'):
                            results.append({'title': title, 'href': href, 'snippet': snippet})
                            if len(results) >= max_results:
                                break
    except Exception as e:
        print(f"[Magpie] Bing search error: {e}")
    return results

def search_wikipedia(query: str, max_results=3):
    """Fallback search using Wikipedia API."""
    results = []
    try:
        wiki_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": query,
                "format": "json",
                "utf8": 1,
                "srlimit": max_results
            },
            headers={'User-Agent': 'MagpieWebAgent/1.1 (https://github.com/sowmiyan-s/Magpie)'},
            timeout=4
        )
        if wiki_resp.status_code == 200:
            data = wiki_resp.json()
            for item in data.get('query', {}).get('search', []):
                title = item.get('title', '')
                page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                raw_snippet = item.get('snippet', '')
                snippet = BeautifulSoup(raw_snippet, 'html.parser').get_text(strip=True)
                results.append({'title': title, 'href': page_url, 'snippet': snippet})
    except Exception as e:
        print(f"[Magpie] Wikipedia search error: {e}")
    return results

def search_web(query: str, max_results=4):
    """Multi-stage search: DDGS -> Bing -> Wikipedia -> DDG Instant."""
    results = []

    # 1. Try DDGS library if available
    if DDGS is not None:
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    # Harmonize keys across DDGS versions
                    href = r.get('href') or r.get('link') or r.get('url', '')
                    title = r.get('title', '')
                    snippet = r.get('body') or r.get('snippet', '')
                    if href:
                        results.append({'title': title, 'href': href, 'snippet': snippet})
        except Exception as e:
            print(f"[Magpie] DDGS search error: {e}")

    # 2. Fallback to Bing HTML
    if not results:
        results = search_bing_html(query, max_results=max_results)

    # 3. Fallback to DDG Instant Answer
    if not results:
        results = search_ddg_instant(query)

    # 4. Fallback to Wikipedia API
    if not results:
        results = search_wikipedia(query, max_results=max_results)

    return results

def scrape_page(url: str):
    """Lightweight scraper — extracts visible, meaningful text from a webpage."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        response = requests.get(url, headers=headers, timeout=6)
        if response.status_code != 200:
            return f"Status code {response.status_code}"

        soup = BeautifulSoup(response.text, 'html.parser')
        # Remove noisy elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'svg', 'noscript', 'iframe']):
            tag.decompose()

        # Prioritize main article/content container if present
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|post|article|body', re.I)) or soup.body
        if not main_content:
            main_content = soup

        text = ' '.join(main_content.stripped_strings)
        # Collapse multiple whitespace
        text = re.sub(r'\s+', ' ', text)
        return text[:4500]
    except Exception as e:
        return f"Failed to scrape {url}: {str(e)}"

@app.post("/api/agent")
async def handle_agent_query(payload: AgentQuery):
    try:
        query = payload.query.strip()
        if not query:
            return {"error": "Query cannot be empty."}

        search_results = []
        top_url = ""
        scraped_content = ""

        # Step 1: Perform web search if enabled
        if payload.search_enabled or payload.crawl_enabled:
            search_results = search_web(query, max_results=5 if payload.crawl_enabled else 3)
            if search_results:
                top_url = search_results[0].get('href', '')
                if payload.crawl_enabled:
                    scraped_texts = []
                    for r in search_results[:3]:
                        h = r.get('href')
                        if h:
                            txt = scrape_page(h)
                            if not txt.startswith("Status code") and not txt.startswith("Failed to scrape"):
                                scraped_texts.append(f"Source: {r.get('title')}\n{txt[:2500]}")
                    if scraped_texts:
                        scraped_content = "\n\n".join(scraped_texts)
                    else:
                        fallback_snippets = [f"{r.get('title')}: {r.get('snippet')}" for r in search_results if r.get('snippet')]
                        scraped_content = "\n".join(fallback_snippets) if fallback_snippets else "No content scraped."
                else:
                    if top_url:
                        scraped_content = scrape_page(top_url)
                        if not scraped_content or scraped_content.startswith("Status code") or scraped_content.startswith("Failed to scrape"):
                            fallback_snippets = [f"{r.get('title')}: {r.get('snippet')}" for r in search_results if r.get('snippet')]
                            scraped_content = "\n".join(fallback_snippets) if fallback_snippets else "No content scraped."

        # Step 2: Build source references
        sources_list = []
        if top_url:
            sources_list.append(top_url)
        for r in search_results[1:]:
            h = r.get('href')
            if h and h not in sources_list:
                sources_list.append(h)

        additional_links = "\n".join([f"- {r.get('title')}: {r.get('href')}" for r in search_results]) if search_results else "None"

        # Step 3: Integrate active page context if provided
        tab_context_section = ""
        if payload.include_page_context and payload.page_content:
            tab_context_section = f"""
--- CURRENT ACTIVE BROWSER TAB ---
Title: {payload.page_title or 'Untitled'}
URL: {payload.page_url or 'Unknown URL'}
Content:
{payload.page_content[:4000]}
--- END BROWSER TAB CONTEXT ---
"""

        # Step 4: Construct optimized prompt
        mode_instructions = ""
        if payload.mode == "summary" or payload.mode == "default":
            mode_instructions = "5. Focus exclusively on summarizing the content provided. Be brief, using bullet points for key takeaways."
        elif payload.mode == "mcq":
            mode_instructions = "5. Generate multiple-choice questions (with options A, B, C, D and the correct answer) or fill-in-the-blanks based on the context or query."

        if search_results or tab_context_section:
            prompt = f"""You are Magpie, an intelligent web research and browser assistant.

User query: "{query}"
{tab_context_section}
--- Web Research Context ---
Top Source: {top_url or 'None'}
Scraped Content:
{scraped_content or 'No web page scraped.'}

Other Sources:
{additional_links}
--- End Web Research Context ---

Instructions:
1. Answer the query thoroughly, concisely, and accurately using the context provided above.
2. If citing facts from the web or current page, mention the relevant source.
3. Use clean markdown formatting (bullet points, bold text, code blocks where appropriate).
4. If the context doesn't completely answer the question, supplement with your knowledge while being clear about assumptions.
{mode_instructions}"""
        else:
            prompt = f"""You are Magpie, an intelligent research and browser assistant.

User query: "{query}"

Instructions:
Answer the query accurately, clearly, and concisely using markdown formatting.
{mode_instructions}"""

        # Step 5: Configure OpenAI-compatible client
        api_key = payload.api_key.strip() if payload.api_key else ""
        base_url = payload.base_url.strip() if payload.base_url else None

        # Handle local providers (Ollama, LM Studio) that don't need real keys
        if not api_key:
            if base_url and ("localhost" in base_url or "127.0.0.1" in base_url):
                api_key = "ollama"
            else:
                api_key = os.environ.get("OPENAI_API_KEY", "dummy")

        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url

        client = OpenAI(**client_kwargs)

        model_name = payload.model_name.strip() if payload.model_name else "llama3"

        # Special handling for reasoning models (o1, o3, etc.) which don't support temperature
        is_reasoning_model = any(m in model_name.lower() for m in ["o1", "o3", "deepseek-r1"])

        completion_kwargs = {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
        }

        if is_reasoning_model:
            completion_kwargs["max_completion_tokens"] = 1200
        else:
            completion_kwargs["temperature"] = 0.5
            completion_kwargs["max_tokens"] = 1000

        response = client.chat.completions.create(**completion_kwargs)
        answer = response.choices[0].message.content or "No response received."

        # Append source footnotes cleanly if web search was performed
        if sources_list:
            sources_footer = "\n\n---\n**Sources:**\n" + "\n".join([f"- <{url}>" for url in sources_list[:3]])
            final_answer = f"{answer}{sources_footer}"
        elif payload.include_page_context and payload.page_url:
            final_answer = f"{answer}\n\n---\n**Source:** Current Tab ({payload.page_url})"
        else:
            final_answer = answer

        return {
            "answer": final_answer,
            "sources": sources_list,
            "searched": bool(search_results),
            "top_url": top_url
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
