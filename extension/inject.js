(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        
        // We clone the response so the actual application can still read the original stream
        const clone = response.clone();
        
        clone.json().then(data => {
            // Check if this response payload looks like it contains limits data
            const strData = JSON.stringify(data).toLowerCase();
            if (strData.includes('resets_at') || strData.includes('remaining') || strData.includes('limit')) {
                 window.postMessage({
                     source: 'CLAUDE_INTERCEPTOR',
                     payload: data
                 }, '*');
            }
        }).catch(e => { /* Not JSON or cannot be read, safely ignore */ });
        
        return response;
    };
})();
