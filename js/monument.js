/*
    MONUMENT
    Core controller handling module registration and UI routing.
*/

const Monument = {
    modules: {},

    register(name, moduleInstance) {
        this.modules[name] = moduleInstance;
        console.log(`[Monument] Registered module: ${name}`);
    },

    getModule(name) {
        return this.modules[name];
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const seekBrowser = document.getElementById('seek-browser');
    const browserHomeBtn = document.getElementById('browser-home-btn');
    const browserUrlDisplay = document.getElementById('browser-url-display');
    const browserViewContainer = document.getElementById('browser-view-container');
    const shortcuts = document.querySelectorAll('.shortcut-item');

    // Handle search input execution
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                const query = searchInput.value.trim();
                
                // Check if user typed an explicit seek protocol URL
                if (query.startsWith('seek://')) {
                    navigateTo(query);
                } else if (window.Seek) {
                    // Dispatch through Seek API module
                    const result = Seek.search(query);
                    navigateTo(`seek://search?q=${encodeURIComponent(query)}`, result);
                } else {
                    navigateTo(`seek://search?q=${encodeURIComponent(query)}`);
                }
            }
        });
    }

    // Handle shortcut button clicks
    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', () => {
            const moduleName = shortcut.getAttribute('data-module');
            navigateTo(`seek://module/${moduleName}`);
        });
    });

    // Home button takes you back to main Monument page
    if (browserHomeBtn) {
        browserHomeBtn.addEventListener('click', () => {
            seekBrowser.classList.add('hidden');
            if (searchInput) searchInput.value = '';
        });
    }

    function navigateTo(url, apiData = null) {
        if (browserUrlDisplay) {
            browserUrlDisplay.textContent = url;
        }

        // Render views based on route
        if (url === 'seek://about') {
            browserViewContainer.innerHTML = `
                <div class="browser-info-card">
                    <h1>Seek Browser (v0.1.0)</h1>
                    <p class="subtitle">What this browser will do:</p>
                    <ul class="feature-list">
                        <li><span>🌐</span> Execute modular queries and track search history using the SeekEngine API.</li>
                        <li><span>⚡</span> Seamlessly bridge communication between Monument core, Starlight, and Scribbles entities.</li>
                        <li><span>🔒</span> Provide an isolated, secure workspace window with custom protocol routing.</li>
                    </ul>
                </div>
            `;
        } else if (url.startsWith('seek://search')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const q = urlParams.get('q') || 'Unknown query';
            
            browserViewContainer.innerHTML = `
                <div class="browser-info-card">
                    <h1>Search Results</h1>
                    <p class="query-echo">Query: "${q}"</p>
                    <div class="api-response-box">
                        <p><strong>Active Engine:</strong> ${apiData ? apiData.engine : 'SeekEngine'}</p>
                        <p><strong>Status:</strong> ${apiData ? apiData.status : 'Dispatched'}</p>
                        <p><strong>Tracking:</strong> ${apiData && apiData.tracking ? 'Active (Logged to Seek History)' : 'Idle'}</p>
                    </div>
                </div>
            `;
        } else if (url.startsWith('seek://module/')) {
            const modName = url.split('/')[3];
            browserViewContainer.innerHTML = `
                <div class="browser-info-card">
                    <h1>Module View: ${modName.toUpperCase()}</h1>
                    <p>Loading internal entity workspace for <strong>${modName}</strong>...</p>
                </div>
            `;
        }

        seekBrowser.classList.remove('hidden');
    }

    // Open default seek://about on startup or allow direct interaction
    window.openSeekBrowser = navigateTo;
});
