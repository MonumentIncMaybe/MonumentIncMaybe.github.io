/*
    MONUMENT
    Core controller handling module registration, routing, and editable browser tabs.
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
    const browserUrlInput = document.getElementById('browser-url-input');
    const browserViewContainer = document.getElementById('browser-view-container');
    const shortcuts = document.querySelectorAll('.shortcut-item');

    // Handle home screen search bar submission
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                const query = searchInput.value.trim();
                if (query.startsWith('seek://')) {
                    navigateTo(query);
                } else {
                    if (window.Seek) {
                        Seek.search(query);
                    }
                    navigateTo(`seek://search?q=${encodeURIComponent(query)}`);
                }
            }
        });
    }

    // Handle editable browser URL input submission inside the topbar
    if (browserUrlInput) {
        browserUrlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && browserUrlInput.value.trim() !== '') {
                navigateTo(browserUrlInput.value.trim());
            }
        });
    }

    // Handle shortcut buttons (Icons only)
    shortcuts.forEach(shortcut => {
        shortcut.addEventListener('click', () => {
            const moduleName = shortcut.getAttribute('data-module');
            navigateTo(`seek://module/${moduleName}`);
        });
    });

    // Home button returns to Monument main view
    if (browserHomeBtn) {
        browserHomeBtn.addEventListener('click', () => {
            seekBrowser.classList.add('hidden');
            if (searchInput) searchInput.value = '';
        });
    }

    // Route handler
    function navigateTo(url) {
        if (browserUrlInput) {
            browserUrlInput.value = url;
        }

        // Exact route seek://about takes up the whole projected page area
        if (url.trim() === 'seek://about') {
            browserViewContainer.innerHTML = `
                <div class="about-fullpage">
                    <div class="about-header">
                        <h1>Seek Browser</h1>
                        <span class="about-badge">v0.1.0</span>
                    </div>
                    <div class="about-grid">
                        <div class="about-card">
                            <h3>Search Routing</h3>
                            <p>Processes queries through the internal SeekEngine API, dispatching commands and tracking local session history.</p>
                        </div>
                        <div class="about-card">
                            <h3>Entity Bridge</h3>
                            <p>Coordinates live interactions between Monument core, Starlight, and Scribbles modules in real time.</p>
                        </div>
                        <div class="about-card">
                            <h3>Custom Protocols</h3>
                            <p>Handles direct protocol navigation like <code>seek://</code> endpoints for modular web rendering and custom workspaces.</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Anything other than seek://about shows WIP
            browserViewContainer.innerHTML = `
                <div class="wip-fullpage">
                    <h1>WIP</h1>
                    <p>This path ("${url}") is currently under development.</p>
                </div>
            `;
        }

        seekBrowser.classList.remove('hidden');
    }

    window.openSeekBrowser = navigateTo;
});
