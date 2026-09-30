// This script is injected into web pages.
// It can be expanded to allow the background script to request the current page's DOM
// if the Agent decides it needs to read the page the user is currently looking at.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'get_page_content') {
    // Basic extraction of visible text
    const textContent = document.body.innerText;
    sendResponse({ content: textContent });
  }
});
