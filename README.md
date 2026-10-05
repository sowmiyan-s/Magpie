# 🐦 Magpie — AI Web Agent

> An agentic AI browser extension that **searches, scrapes, and analyzes the web** using any LLM provider.  
> Works with **Ollama, OpenAI, Groq, Mistral, NVIDIA NIM, OpenRouter, Together AI** and any OpenAI-compatible endpoint.

---

#web-agent# ✨ Features

- 🔍 **Agentic Web Search** — Searches the web via DuckDuckGo, scrapes top results, and feeds them to your chosen LLM.
- 🧠 **8 LLM Providers** — One-click switching between Ollama, OpenAI, Groq, Mistral AI, NVIDIA NIM, OpenRouter, Together AI, or any custom endpoint.
- ⚡ **Clickable Model Tags** — See available models for each provider and click to select.
- 🪶 **Lightweight** — Only 4 Python dependencies. Runs on any machine.
- 🔑 **No Hardcoded Keys** — All API keys are configured in the browser UI and stored locally.
- ⌨️ **Ctrl+G Shortcut** — Open the agent instantly from any tab.
- 🖥️ **Open in Tab** — Expand the popup into a full browser tab for a larger workspace.
- 🎨 **Neo-Brutalist Design** — Bold, tactile UI with hard shadows, thick borders, and vibrant colors.

---

## 📁 Project Structure

```
magpie/
├── extension/                  # Chrome Extension (load this folder)
│   ├── icons/
│   │   └── icon.svg            # Extension icon
│   ├── background.js           # Service worker — routes messages to backend
│   ├── content.js              # Content script — reads current page
│   ├── manifest.json           # Extension manifest (MV3)
│   ├── popup.html              # Neo-Brutalist popup UI
│   └── popup.js                # Provider configs, model tags & interaction logic
│
├── backend/                    # Python API Server
│   ├── app.py                  # FastAPI backend (search → scrape → LLM)
│   └── requirements.txt        # 4 lightweight dependencies
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server starts at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the API docs.

### 2. Load the Extension

1. Open `chrome://extensions/` in Chrome, Edge, or Brave.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** → select the `extension/` folder.
4. Pin the Magpie icon from the puzzle piece menu.

### 3. Configure & Go

1. Click the Magpie icon (or press **Ctrl+G**).
2. Open **⚙️ LLM Provider** and pick your provider from the dropdown.
3. Click any **model tag** to auto-fill the model name.
4. Enter your API key and click **Save Config ➔**.
5. Type a question and hit **Search & Analyze ➔** !

---

## 🔌 Supported Providers

| Provider | Base URL | Example Models |
|---|---|---|
| **Local Ollama** | `http://localhost:11434/v1` | llama3, mistral, gemma2, phi3 |
| **OpenAI** | *(default)* | gpt-4o-mini, gpt-4o, o3-mini |
| **Groq** | `https://api.groq.com/openai/v1` | llama-3.3-70b-versatile, mixtral-8x7b |
| **Mistral AI** | `https://api.mistral.ai/v1` | mistral-small, mistral-large, codestral |
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | llama-3.1-405b, nemotron-4-340b |
| **OpenRouter** | `https://openrouter.ai/api/v1` | llama-3.1-8b:free, gemma-2-9b:free |
| **Together AI** | `https://api.together.xyz/v1` | Meta-Llama-3.1-8B-Instruct-Turbo |
| **Custom** | *Your URL* | *Your model* |

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (Chrome Extension Manifest V3)
- **Backend**: Python + FastAPI
- **Search**: DuckDuckGo (no API key needed)
- **Scraping**: BeautifulSoup4
- **LLM**: OpenAI Python SDK (compatible with all providers above)

---

## 📜 License

MIT License — see [LICENSE](LICENSE).
