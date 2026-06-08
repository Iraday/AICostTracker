// 1. API Interceptor
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(script);

window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data || event.data.source !== 'CLAUDE_INTERCEPTOR') return;
    
    fetch('http://localhost:3334/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "API_INTERCEPT", data: event.data.payload })
    }).catch(err => console.log('AICostTracker Sync Error:', err));
});

// 2. DOM Scraper (Reads the actual text when you open the modal)
let lastScrapedData = "";
setInterval(() => {
    const text = document.body.innerText;
    if (text && text.includes("Plan usage limits") && text.includes("Current session") && text.includes("Resets in")) {
        const sessionMatch = text.match(/Current session\s*Resets in (.*?)\s*(\d+)%\s*used/);
        const weeklyMatch = text.match(/All models\s*Resets in (.*?)\s*(\d+)%\s*used/);
        
        if (sessionMatch && weeklyMatch) {
            const payload = {
                type: "DOM_SCRAPE",
                session: {
                    resetText: `Resets in ${sessionMatch[1]}`,
                    usedPercentage: parseInt(sessionMatch[2], 10)
                },
                weekly: {
                    resetText: `Resets in ${weeklyMatch[1]}`,
                    usedPercentage: parseInt(weeklyMatch[2], 10)
                }
            };
            
            const payloadStr = JSON.stringify(payload);
            if (payloadStr !== lastScrapedData) {
                lastScrapedData = payloadStr;
                fetch('http://localhost:3334/api/usage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payloadStr
                }).catch(() => {});
            }
        }
    }
}, 1000);
