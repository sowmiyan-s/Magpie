// ─── Magpie — popup.js ───
// Provider configuration database
const PROVIDERS = {
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    apiKey: 'ollama',
    apiKeyHint: "Use 'ollama' (no real key needed).",
    baseUrlHint: 'Default Ollama local endpoint.',
    models: [
      { name: 'llama3', color: '#FFE600' },
      { name: 'mistral', color: '#63E6E2' },
      { name: 'gemma2', color: '#FF90E8' },
      { name: 'phi3', color: '#7DFFB3' },
      { name: 'qwen2', color: '#B8A1E8' },
      { name: 'codellama', color: '#FF6B00' },
    ]
  },
  openai: {
    baseUrl: '',
    apiKey: '',
    apiKeyHint: 'Your OpenAI API key (sk-...).',
    baseUrlHint: 'Leave blank for default OpenAI.',
    models: [
      { name: 'gpt-4o-mini', color: '#7DFFB3' },
      { name: 'gpt-4o', color: '#63E6E2' },
      { name: 'gpt-4.1-nano', color: '#FFE600' },
      { name: 'gpt-4.1-mini', color: '#FF90E8' },
      { name: 'o3-mini', color: '#B8A1E8' },
    ]
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: '',
    apiKeyHint: 'Your Groq API key (gsk_...).',
    baseUrlHint: 'Groq cloud endpoint (auto-filled).',
    models: [
      { name: 'llama-3.3-70b-versatile', color: '#FFE600' },
      { name: 'llama-3.1-8b-instant', color: '#63E6E2' },
      { name: 'mixtral-8x7b-32768', color: '#FF90E8' },
      { name: 'gemma2-9b-it', color: '#7DFFB3' },
    ]
  },
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '',
    apiKeyHint: 'Your Mistral API key.',
    baseUrlHint: 'Mistral AI endpoint (auto-filled).',
    models: [
      { name: 'mistral-small-latest', color: '#63E6E2' },
      { name: 'mistral-medium-latest', color: '#FFE600' },
      { name: 'mistral-large-latest', color: '#FF90E8' },
      { name: 'open-mistral-nemo', color: '#7DFFB3' },
      { name: 'codestral-latest', color: '#B8A1E8' },
    ]
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: '',
    apiKeyHint: 'Your NVIDIA NIM API key (nvapi-...).',
    baseUrlHint: 'NVIDIA NIM endpoint (auto-filled).',
    models: [
      { name: 'meta/llama-3.1-405b-instruct', color: '#7DFFB3' },
      { name: 'meta/llama-3.1-70b-instruct', color: '#FFE600' },
      { name: 'mistralai/mistral-large-2-instruct', color: '#63E6E2' },
      { name: 'google/gemma-2-27b-it', color: '#FF90E8' },
      { name: 'nvidia/nemotron-4-340b-instruct', color: '#B8A1E8' },
    ]
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    apiKeyHint: 'Your OpenRouter API key.',
    baseUrlHint: 'OpenRouter endpoint (auto-filled).',
    models: [
      { name: 'meta-llama/llama-3.1-8b-instruct:free', color: '#7DFFB3' },
      { name: 'google/gemma-2-9b-it:free', color: '#FFE600' },
      { name: 'mistralai/mistral-7b-instruct:free', color: '#63E6E2' },
    ]
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    apiKey: '',
    apiKeyHint: 'Your Together AI API key.',
    baseUrlHint: 'Together AI endpoint (auto-filled).',
    models: [
      { name: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', color: '#FFE600' },
      { name: 'mistralai/Mixtral-8x7B-Instruct-v0.1', color: '#63E6E2' },
      { name: 'Qwen/Qwen2-72B-Instruct', color: '#FF90E8' },
    ]
  },
  custom: {
    baseUrl: '',
    apiKey: '',
    apiKeyHint: 'Your API key for the custom endpoint.',
    baseUrlHint: 'Enter your OpenAI-compatible endpoint URL.',
    models: []
  }
};

// ─── DOM Elements ───
const providerSelect = document.getElementById('llm-provider');
const baseUrlInput = document.getElementById('base-url');
const apiKeyInput = document.getElementById('api-key');
const modelNameInput = document.getElementById('model-name');
const baseUrlHint = document.getElementById('base-url-hint');
const apiKeyHint = document.getElementById('api-key-hint');
const modelHint = document.getElementById('model-hint');
const providerModels = document.getElementById('provider-models');
const saveBtn = document.getElementById('save-settings-btn');
const saveStatus = document.getElementById('save-status');
const openTabBtn = document.getElementById('open-tab-btn');
const askBtn = document.getElementById('ask-btn');
const queryInput = document.getElementById('query');
const resultDiv = document.getElementById('result');

// ─── Load saved settings on startup ───
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['provider', 'baseUrl', 'apiKey', 'modelName'], (data) => {
    if (data.provider) providerSelect.value = data.provider;
    if (data.baseUrl) baseUrlInput.value = data.baseUrl;
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.modelName) modelNameInput.value = data.modelName;
    renderProviderModels(providerSelect.value);
  });
});

// ─── Render clickable model tags ───
function renderProviderModels(providerKey) {
  const provider = PROVIDERS[providerKey];
  if (!provider) return;

  providerModels.innerHTML = '';
  provider.models.forEach(m => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = m.name;
    tag.style.background = m.color;
    tag.style.cursor = 'pointer';
    tag.title = `Click to use ${m.name}`;
    tag.addEventListener('click', () => {
      modelNameInput.value = m.name;
    });
    providerModels.appendChild(tag);
  });

  // Update hints
  baseUrlHint.textContent = provider.baseUrlHint;
  apiKeyHint.textContent = provider.apiKeyHint;
}

// ─── Provider change: auto-fill defaults + render model tags ───
providerSelect.addEventListener('change', (e) => {
  const key = e.target.value;
  const provider = PROVIDERS[key];
  if (!provider) return;

  baseUrlInput.value = provider.baseUrl;
  apiKeyInput.value = provider.apiKey;
  modelNameInput.value = provider.models.length > 0 ? provider.models[0].name : '';
  renderProviderModels(key);
});

// ─── Save settings ───
saveBtn.addEventListener('click', () => {
  const provider = providerSelect.value;
  const baseUrl = baseUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const modelName = modelNameInput.value.trim() || 'llama3';

  chrome.storage.local.set({ provider, baseUrl, apiKey, modelName }, () => {
    saveStatus.style.display = 'inline';
    setTimeout(() => { saveStatus.style.display = 'none'; }, 2000);
  });
});

// ─── Open in new tab ───
if (openTabBtn) {
  openTabBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  });
}

// ─── Ask Agent ───
askBtn.addEventListener('click', () => {
  const query = queryInput.value;
  if (!query.trim()) {
    resultDiv.textContent = 'Please enter a query.';
    return;
  }

  chrome.storage.local.get(['baseUrl', 'apiKey', 'modelName'], (settings) => {
    if (!settings.apiKey) {
      resultDiv.textContent = '⚠️ Please configure your API key in the settings above.';
      return;
    }

    resultDiv.innerHTML = '<span class="loading">Magpie is working — searching, scraping & analyzing...</span>';

    const payload = {
      action: 'ask_agent',
      query: query,
      baseUrl: settings.baseUrl || null,
      apiKey: settings.apiKey,
      modelName: settings.modelName || 'llama3'
    };

    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.textContent = '❌ Error: ' + chrome.runtime.lastError.message;
        return;
      }
      if (response && response.result) {
        resultDiv.textContent = response.result;
      } else if (response && response.error) {
        resultDiv.textContent = '❌ ' + response.error;
      } else {
        resultDiv.textContent = '❌ Unknown error or backend not responding.';
      }
    });
  });
});
