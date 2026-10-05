// Magpie Content Script - Extracts visible page content for the agent

function extractPageText() {
  const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
  
  // Clone body to manipulate without affecting DOM
  const clone = document.body.cloneNode(true);
  const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, svg, nav, footer');
  elementsToRemove.forEach(el => el.remove());
  
  const rawText = clone.innerText || clone.textContent || '';
  const cleanedText = rawText.replace(/\s+/g, ' ').trim();
  
  return {
    title: document.title || '',
    url: window.location.href || '',
    selection: selection,
    content: cleanedText.slice(0, 8000)
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_page_content') {
    try {
      const pageData = extractPageText();
      sendResponse({ success: true, data: pageData });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
