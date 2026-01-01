// Offline detection and redirect
(function() {
    // Check if page is already the offline page
    if (window.location.pathname.includes('offline.html')) {
        return;
    }

    // Function to redirect to offline page
    function showOfflinePage() {
        if (!window.location.pathname.includes('offline.html')) {
            window.location.href = '/pages/offline.html';
        }
    }

    // Listen for offline event
    window.addEventListener('offline', function() {
        console.log('Internet connection lost');
        showOfflinePage();
    });

    // Check initial connection status
    if (!navigator.onLine) {
        showOfflinePage();
    }

    // Intercept fetch requests to detect connection issues
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        return originalFetch.apply(this, args)
            .catch(error => {
                // If it's a network error, show offline page
                if (error.message.includes('Failed to fetch') || 
                    error.message.includes('NetworkError') ||
                    error.message.includes('Network request failed')) {
                    console.log('Network error detected:', error.message);
                    if (!navigator.onLine) {
                        showOfflinePage();
                    }
                }
                throw error;
            });
    };

    // Periodically check connection (optional backup)
    setInterval(function() {
        if (!navigator.onLine) {
            showOfflinePage();
        }
    }, 10000); // Check every 10 seconds
})();
