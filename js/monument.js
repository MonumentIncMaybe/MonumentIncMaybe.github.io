document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const seekBrowser = document.getElementById('seek-browser');
    const browserHomeBtn = document.getElementById('browser-home-btn');
    const browserUrlDisplay = document.getElementById('browser-url-display');
    const shortcuts = document.querySelectorAll('.shortcut-item');

    // Trigger Seek browser simulation when typing/pressing enter in the search input
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                const query = searchInput.value.trim();
                openSeekBrowser(`seek://search?q=${encodeURIComponent(query)}`);
            }
        });
    }

    // Trigger Seek browser simulation when clicking shortcuts
    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', () => {
            const module = shortcut.getAttribute('data-module');
            openSeekBrowser(`seek://module/${module}`);
        });
    });

    // Home button takes you back to main Monument page and resets overlay
    if (browserHomeBtn) {
        browserHomeBtn.addEventListener('click', () => {
            seekBrowser.classList.add('hidden');
            if (searchInput) searchInput.value = '';
        });
    }

    function openSeekBrowser(url) {
        if (browserUrlDisplay) {
            browserUrlDisplay.textContent = url;
        }
        seekBrowser.classList.remove('hidden');
    }
});
