// Magpie Background Service Worker (MV3)

const DEFAULT_BACKEND_URL = 'http://localhost:8000';

// Helper to get backend URL from storage
async function getBackendUrl() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['customBackendUrl'], (data) => {
      resolve(data.customBackendUrl || DEFAULT_BACKEND_URL);
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 1. Health check
  if (request.action === 'check_backend') {
    getBackendUrl().then((baseUrl) => {
      fetch(`${baseUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(3000) })
        .then((res) => res.json())
        .then((data) => sendResponse({ online: true, data }))
        .catch(() => sendResponse({ online: false }));
    });
    return true;
  }

  // 2. Query Agent
  if (request.action === 'ask_agent') {
    getBackendUrl().then((baseUrl) => {
      const endpoint = `${baseUrl}/api/agent`;

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: request.query,
          base_url: request.baseUrl || null,
          api_key: request.apiKey || '',
          model_name: request.modelName || 'llama3',
          include_page_context: Boolean(request.includePageContext),
          page_url: request.pageUrl || null,
          page_title: request.pageTitle || null,
          page_content: request.pageContent || null,
          search_enabled: request.searchEnabled !== false,
          crawl_enabled: Boolean(request.crawlEnabled),
          mode: request.mode || 'summary'
        })
      })
      .then(async (response) => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || errData.error || `Server responded with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          sendResponse({ error: data.error });
        } else {
          sendResponse({
            result: data.answer,
            sources: data.sources || [],
            searched: data.searched
          });
        }
      })
      .catch((error) => {
        sendResponse({
          error: `Cannot connect to backend (${baseUrl}). Is 'python app.py' running? Details: ${error.message}`
        });
      });
    });

    return true; // asynchronous response
  }

  // 3. Get Active Tab Content
  if (request.action === 'get_active_tab_content') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'No active tab found.' });
        return;
      }
      const activeTab = tabs[0];

      // Disallowed schemes
      if (!activeTab.url || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('edge://') || activeTab.url.startsWith('about:')) {
        sendResponse({
          success: true,
          data: {
            title: activeTab.title || 'Browser Tab',
            url: activeTab.url || '',
            content: 'Browser internal page (content inspection not permitted).'
          }
        });
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: 'get_page_content' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // If content script was not injected yet, inject script directly
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              const clone = document.body.cloneNode(true);
              const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, svg, nav, footer');
              elementsToRemove.forEach(el => el.remove());
              const text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
              return {
                title: document.title || '',
                url: window.location.href || '',
                content: text.slice(0, 8000)
              };
            }
          }, (injectionResults) => {
            if (chrome.runtime.lastError || !injectionResults || !injectionResults[0]) {
              sendResponse({
                success: true,
                data: {
                  title: activeTab.title || '',
                  url: activeTab.url || '',
                  content: 'Could not access page DOM.'
                }
              });
            } else {
              sendResponse({ success: true, data: injectionResults[0].result });
            }
          });
        } else {
          sendResponse({ success: true, data: response.data });
        }
      });
    });

    return true;
  }
});
