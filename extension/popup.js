// ─── Magpie — popup.js (Refined Modern UI) ───

const PROVIDERS = {
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
    apiKeyHint: 'Your Mistral API key (e.g. iXaJXz6...).',
    baseUrlHint: 'Mistral endpoint: https://api.mistral.ai/v1',
    models: [
      { name: 'open-mistral-nemo' },
      { name: 'codestral-latest' },
      { name: 'open-mistral-7b' },
      { name: 'mistral-small-latest' },
      { name: 'mistral-large-latest' },
    ]
  },
  ollama: {
    name: 'Local Ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    apiKeyHint: "Use 'ollama' (no key needed).",
    baseUrlHint: 'Local endpoint: http://localhost:11434/v1',
    models: [
      { name: 'llama3' },
      { name: 'mistral' },
      { name: 'qwen2.5' },
      { name: 'gemma2' },
      { name: 'deepseek-r1' },
    ]
  },
  openai: {
    name: 'OpenAI',
    baseUrl: '',
    apiKey: '',
    apiKeyHint: 'Your OpenAI API key (sk-...).',
    baseUrlHint: 'Default OpenAI endpoint.',
    models: [
      { name: 'gpt-4o-mini' },
      { name: 'gpt-4o' },
      { name: 'o3-mini' },
      { name: 'o1' },
    ]
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: '',
    apiKeyHint: 'Your Groq API key (gsk_...).',
    baseUrlHint: 'Groq endpoint: https://api.groq.com/openai/v1',
    models: [
      { name: 'llama-3.3-70b-versatile' },
      { name: 'llama-3.1-8b-instant' },
      { name: 'mixtral-8x7b-32768' },
    ]
  },
  nvidia: {
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: '',
    apiKeyHint: 'Your NVIDIA NIM API key.',
    baseUrlHint: 'Endpoint: https://integrate.api.nvidia.com/v1',
    models: [
      { name: 'meta/llama-3.1-70b-instruct' },
      { name: 'mistralai/mistral-large-2-instruct' },
      { name: 'nvidia/nemotron-4-340b-instruct' },
    ]
  },
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    apiKeyHint: 'Your OpenRouter API key.',
    baseUrlHint: 'Endpoint: https://openrouter.ai/api/v1',
    models: [
      { name: 'meta-llama/llama-3.1-8b-instruct:free' },
      { name: 'deepseek/deepseek-r1:free' },
    ]
  },
  together: {
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    apiKey: '',
    apiKeyHint: 'Your Together AI API key.',
    baseUrlHint: 'Endpoint: https://api.together.xyz/v1',
    models: [
      { name: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo' },
      { name: 'Qwen/Qwen2.5-72B-Instruct-Turbo' },
    ]
  },
  custom: {
    name: 'Custom Endpoint',
    baseUrl: '',
    apiKey: '',
    apiKeyHint: 'API key if needed.',
    baseUrlHint: 'e.g. http://localhost:1234/v1',
    models: []
  }
};

// ─── DOM References ───
const viewMain = document.getElementById('view-main');
const viewSettings = document.getElementById('view-settings');
const btnToggleSettings = document.getElementById('btn-toggle-settings');
const btnOpenTab = document.getElementById('btn-open-tab');
const btnSettingsDone = document.getElementById('btn-settings-done');
const brandLink = document.getElementById('brand-link');

const headerModelChip = document.getElementById('header-model-chip');
const headerModelName = document.getElementById('header-model-name');
const headerStatusDot = document.getElementById('header-status-dot');

const queryInput = document.getElementById('query');
const askBtn = document.getElementById('ask-btn');
const resultCard = document.getElementById('result-card');
const resultDiv = document.getElementById('result');
const resultTitle = document.getElementById('result-title');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const sourcesList = document.getElementById('sources-list');

const searchToggle = document.getElementById('search-enabled-toggle');
const tabToggle = document.getElementById('tab-context-toggle');
const chipSearch = document.getElementById('chip-search');
const chipTab = document.getElementById('chip-tab');
const modeSelect = document.getElementById('mode-select');

// Settings Elements
const providerSelect = document.getElementById('llm-provider');
const providerModels = document.getElementById('provider-models');
const modelNameInput = document.getElementById('model-name');
const apiKeyInput = document.getElementById('api-key');
const baseUrlInput = document.getElementById('base-url');
const backendUrlInput = document.getElementById('backend-url');
const apiKeyHint = document.getElementById('api-key-hint');
const baseUrlHint = document.getElementById('base-url-hint');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const saveStatus = document.getElementById('save-status');
const serverStatusPill = document.getElementById('server-status-pill');
const serverStatusDot = document.getElementById('server-status-dot');
const serverStatusText = document.getElementById('server-status-text');

let currentActiveTabData = null;

// ─── Detect Tab Mode ───
if (window.innerWidth > 520 || window.location.search.includes('tab=1')) {
  document.body.classList.add('tab-mode');
  if (btnOpenTab) btnOpenTab.style.display = 'none';
}

// ─── View Toggle ───
function switchView(viewName) {
  if (viewName === 'settings') {
    viewMain.classList.remove('active');
    viewSettings.classList.add('active');
    btnToggleSettings.classList.add('active');
    checkBackendHealth();
  } else {
    viewSettings.classList.remove('active');
    viewMain.classList.add('active');
    btnToggleSettings.classList.remove('active');
  }
}

btnToggleSettings.addEventListener('click', () => {
  if (viewSettings.classList.contains('active')) {
    switchView('main');
  } else {
    switchView('settings');
  }
});

headerModelChip.addEventListener('click', () => {
  switchView('settings');
});

btnSettingsDone.addEventListener('click', () => {
  switchView('main');
});

brandLink.addEventListener('click', () => {
  switchView('main');
});

if (btnOpenTab) {
  btnOpenTab.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?tab=1') });
  });
}

// ─── Toggle Chips (Web / Tab) ───
chipSearch.addEventListener('click', (e) => {
  if (e.target.tagName !== 'INPUT') {
    searchToggle.checked = !searchToggle.checked;
  }
  chipSearch.classList.toggle('active', searchToggle.checked);
  chrome.storage.local.set({ searchEnabled: searchToggle.checked });
});

chipTab.addEventListener('click', (e) => {
  if (e.target.tagName !== 'INPUT') {
    tabToggle.checked = !tabToggle.checked;
  }
  chipTab.classList.toggle('active', tabToggle.checked);
  chrome.storage.local.set({ includeTabContext: tabToggle.checked });
});

modeSelect.addEventListener('change', (e) => {
  chrome.storage.local.set({ mode: e.target.value });
});

// ─── Render Model Chips in Settings ───
function renderProviderModels(providerKey, selectedModel) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return;

  providerModels.innerHTML = '';
  if (provider.models.length === 0) {
    providerModels.innerHTML = '<span style="font-size:11px; color:#94A3B8;">Custom model name can be typed below</span>';
  } else {
    provider.models.forEach(m => {
      const chip = document.createElement('span');
      chip.className = 'model-chip-select';
      chip.textContent = m.name;
      if (m.name === selectedModel) {
        chip.classList.add('active');
      }
      chip.addEventListener('click', () => {
        modelNameInput.value = m.name;
        document.querySelectorAll('.model-chip-select').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
      providerModels.appendChild(chip);
    });
  }

  baseUrlHint.textContent = provider.baseUrlHint;
  apiKeyHint.textContent = provider.apiKeyHint;
}

// ─── Provider Change ───
providerSelect.addEventListener('change', (e) => {
  const key = e.target.value;
  const provider = PROVIDERS[key];
  if (!provider) return;

  baseUrlInput.value = provider.baseUrl;
  apiKeyInput.value = provider.apiKey;
  const defaultModel = provider.models.length > 0 ? provider.models[0].name : '';
  modelNameInput.value = defaultModel;
  renderProviderModels(key, defaultModel);
});

// ─── Save Settings ───
saveSettingsBtn.addEventListener('click', () => {
  const provider = providerSelect.value;
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const modelName = modelNameInput.value.trim() || 'open-mistral-nemo';
  const customBackendUrl = backendUrlInput.value.trim() || 'http://localhost:8000';

  chrome.storage.local.set({
    provider,
    baseUrl,
    apiKey,
    modelName,
    customBackendUrl
  }, () => {
    saveStatus.style.display = 'inline-block';
    setTimeout(() => { saveStatus.style.display = 'none'; }, 1800);
    checkBackendHealth();
  });
});

// ─── Health Check ───
function checkBackendHealth() {
  serverStatusPill.className = 'server-status';
  serverStatusText.textContent = 'Checking...';
  serverStatusDot.style.background = '#94A3B8';

  chrome.runtime.sendMessage({ action: 'check_backend' }, (response) => {
    if (chrome.runtime.lastError || !response || !response.online) {
      serverStatusPill.className = 'server-status offline';
      serverStatusText.textContent = 'Offline (Run app.py)';
      serverStatusDot.style.background = '#EF4444';
      headerStatusDot.classList.add('offline');
      headerModelChip.title = 'Backend Offline — start app.py';
    } else {
      serverStatusPill.className = 'server-status online';
      serverStatusText.textContent = 'Online';
      serverStatusDot.style.background = '#10B981';
      headerStatusDot.classList.remove('offline');
      headerModelChip.title = `Agent Online (Backend Connected)`;
    }
  });
}

// ─── Active Tab Loader ───
function loadCurrentTab() {
  chrome.runtime.sendMessage({ action: 'get_active_tab_content' }, (response) => {
    if (response && response.success && response.data) {
      currentActiveTabData = response.data;
    }
  });
}

// ─── Startup Initialization ───
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get([
    'provider',
    'baseUrl',
    'apiKey',
    'modelName',
    'customBackendUrl',
    'searchEnabled',
    'includeTabContext',
    'mode'
  ], (data) => {
    const selectedProvider = data.provider || 'mistral';
    providerSelect.value = selectedProvider;

    const providerDef = PROVIDERS[selectedProvider];
    baseUrlInput.value = data.baseUrl !== undefined ? data.baseUrl : (providerDef ? providerDef.baseUrl : '');
    apiKeyInput.value = data.apiKey !== undefined ? data.apiKey : (providerDef ? providerDef.apiKey : '');
    const model = data.modelName || (providerDef && providerDef.models.length > 0 ? providerDef.models[0].name : 'open-mistral-nemo');
    modelNameInput.value = model;
    backendUrlInput.value = data.customBackendUrl || 'http://localhost:8000';

    if (data.searchEnabled !== undefined) {
      searchToggle.checked = Boolean(data.searchEnabled);
      chipSearch.classList.toggle('active', searchToggle.checked);
    }
    if (data.includeTabContext !== undefined) {
      tabToggle.checked = Boolean(data.includeTabContext);
      chipTab.classList.toggle('active', tabToggle.checked);
    }
    if (data.mode !== undefined) {
      modeSelect.value = data.mode;
    }

    renderProviderModels(selectedProvider, model);
    checkBackendHealth();
    loadCurrentTab();
  });
});

// ─── Quick Starter Buttons ───
document.querySelectorAll('.starter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const q = btn.getAttribute('data-query');
    const isTab = btn.getAttribute('data-tab') === 'true';
    const isSearch = btn.getAttribute('data-search') === 'true';

    queryInput.value = q;
    if (isTab) {
      tabToggle.checked = true;
      chipTab.classList.add('active');
    }
    if (isSearch) {
      searchToggle.checked = true;
      chipSearch.classList.add('active');
    }
    executeQuery();
  });
});

// ─── Safe Markdown Renderer ───
function renderMarkdown(md) {
  if (!md) return '';

  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Bracket links: <https://...>
  html = html.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered list items: * or -
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/gi, '<ul>$1</ul>');
  html = html.replace(/<\/ul>\s*<ul>/gi, '');

  // Line breaks to paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  return paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<blockquote')) return p;
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
}

// ─── Execute Agent Query ───
function executeQuery() {
  const query = queryInput.value.trim();
  if (!query) {
    resultDiv.innerHTML = '<span style="color:#EF4444; font-weight:600;">Please enter a question or query.</span>';
    return;
  }

  chrome.storage.local.get(['baseUrl', 'apiKey', 'modelName', 'provider'], (settings) => {
    const isLocal = settings.provider === 'ollama' || (settings.baseUrl && settings.baseUrl.includes('localhost'));
    if (!settings.apiKey && !isLocal) {
      resultDiv.innerHTML = `
        <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:8px; padding:10px; color:#991B1B;">
          <strong>API Key Needed</strong><br>
          Click <strong>⚙️</strong> top-right to configure your key for ${settings.provider || 'your provider'}.
        </div>`;
      switchView('settings');
      return;
    }

    resultCard.classList.add('has-content');
    resultTitle.innerHTML = '<span>Researching...</span>';
    resultDiv.innerHTML = `
      <div class="loading-container">
        <div class="spinner-dot"></div>
        <span>Searching web & analyzing with Magpie...</span>
      </div>`;
    sourcesList.style.display = 'none';
    sourcesList.innerHTML = '';

    const includeTab = tabToggle.checked;
    const searchEnabled = searchToggle.checked;
    const mode = modeSelect.value;

    const payload = {
      action: 'ask_agent',
      query: query,
      baseUrl: settings.baseUrl || null,
      apiKey: settings.apiKey || (isLocal ? 'ollama' : ''),
      modelName: settings.modelName || 'open-mistral-nemo',
      searchEnabled: searchEnabled,
      includePageContext: includeTab,
      pageUrl: includeTab && currentActiveTabData ? currentActiveTabData.url : null,
      pageTitle: includeTab && currentActiveTabData ? currentActiveTabData.title : null,
      pageContent: includeTab && currentActiveTabData ? currentActiveTabData.content : null,
      mode: mode
    };

    chrome.runtime.sendMessage(payload, (response) => {
      resultTitle.innerHTML = '<span>Research Answer</span>';

      if (chrome.runtime.lastError) {
        resultDiv.innerHTML = `
          <div style="color:#DC2626; font-weight:600;">
            ❌ Extension Error: ${chrome.runtime.lastError.message}
          </div>`;
        return;
      }

      if (response && response.result) {
        resultDiv.innerHTML = renderMarkdown(response.result);

        // Render sources pills if present
        if (response.sources && response.sources.length > 0) {
          sourcesList.innerHTML = '';
          response.sources.forEach(url => {
            try {
              const u = new URL(url);
              const pill = document.createElement('a');
              pill.className = 'source-pill';
              pill.href = url;
              pill.target = '_blank';
              pill.rel = 'noopener noreferrer';
              pill.innerHTML = `🔗 ${u.hostname}`;
              pill.title = url;
              sourcesList.appendChild(pill);
            } catch {}
          });
          if (sourcesList.children.length > 0) {
            sourcesList.style.display = 'flex';
          }
        }
      } else if (response && response.error) {
        resultDiv.innerHTML = `
          <div style="color:#DC2626; font-size:12.5px; line-height:1.45;">
            <strong>❌ Error:</strong> ${response.error}
          </div>`;
      } else {
        resultDiv.innerHTML = `
          <div style="color:#DC2626; font-size:12.5px;">
            ❌ Backend not responding. Ensure <code>python app.py</code> is running.
          </div>`;
      }
    });
  });
}

askBtn.addEventListener('click', executeQuery);

// Shortcut: Ctrl+Enter or Cmd+Enter
queryInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    executeQuery();
  }
});

// Copy Button
copyBtn.addEventListener('click', () => {
  const text = resultDiv.innerText || resultDiv.textContent;
  if (!text || text.includes('Results will appear here')) return;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });
});

// Clear Button
clearBtn.addEventListener('click', () => {
  queryInput.value = '';
  resultDiv.innerHTML = '<span style="color:#94A3B8; font-size:12.5px;">Results will appear here. Enter your query above.</span>';
  resultCard.classList.remove('has-content');
  sourcesList.style.display = 'none';
  sourcesList.innerHTML = '';
});
