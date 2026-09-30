chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ask_agent') {
    const backendUrl = 'http://localhost:8000/api/agent';
    
    fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: request.query,
        base_url: request.baseUrl,
        api_key: request.apiKey,
        model_name: request.modelName
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        sendResponse({ error: data.error });
      } else {
        sendResponse({ result: data.answer });
      }
    })
    .catch(error => {
      sendResponse({ error: "Failed to connect to Python backend. Is it running on port 8000?" });
    });
    
    // Return true to indicate we wish to send a response asynchronously
    return true; 
  }
});
