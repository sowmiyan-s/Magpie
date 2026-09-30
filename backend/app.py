import os
import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI
from pydantic import BaseModel
from duckduckgo_search import DDGS
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

app = FastAPI(
    title="Magpie Backend",
    description="Lightweight agentic backend for the Magpie browser extension.",
    version="1.0.0"
)

# Allow extension to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "Magpie",
        "status": "running",
        "docs": "/docs",
        "endpoint": "POST /api/agent"
    }

class AgentQuery(BaseModel):
    query: str
    base_url: str | None = None
    api_key: str
    model_name: str

def search_web(query: str, max_results=3):
    """Searches DuckDuckGo and returns URLs."""
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(r)
    except Exception as e:
        print(f"[Magpie] Search error: {e}")
    return results

def scrape_page(url: str):
    """Lightweight scraper — extracts visible text from a webpage."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        # Remove script/style noise
        for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
            tag.decompose()
        text = ' '.join(soup.stripped_strings)
        return text[:4000]  # Optimized context window for low token usage
    except Exception as e:
        return f"Failed to scrape {url}: {str(e)}"

@app.post("/api/agent")
async def handle_agent_query(payload: AgentQuery):
    try:
        query = payload.query

        # 1. Search the web
        search_results = search_web(query, max_results=3)

        if not search_results:
            return {"answer": "I couldn't find any search results for that query."}

        # 2. Scrape the top result
        top_url = search_results[0]['href']
        scraped_content = scrape_page(top_url)

        # Additional context from other results
        additional_links = "\n".join([f"- {r['title']}: {r['href']}" for r in search_results])

        # 3. Build an efficient prompt (minimizes token usage)
        prompt = f"""You are Magpie, a concise web research assistant.

User query: "{query}"

Source: {top_url}

--- Scraped Content ---
{scraped_content}
--- End ---

Other results:
{additional_links}

Instructions: Answer the query accurately using the scraped content above. Be concise but thorough. If the content is insufficient, say so. Always cite the source URL."""

        # 4. Call the LLM via OpenAI-compatible API
        client_kwargs = {"api_key": payload.api_key}
        if payload.base_url:
            client_kwargs["base_url"] = payload.base_url

        client = OpenAI(**client_kwargs)

        response = client.chat.completions.create(
            model=payload.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=800
        )

        answer = response.choices[0].message.content

        # Append source for transparency
        final_answer = f"{answer}\n\n---\nSource: {top_url}"

        return {"answer": final_answer}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
