/*
    SEEK (SeekEngine Module)
    Handles search routing, query processing, and engine tracking.
*/

const Seek = {
    name: "seek",
    entityName: "Seek",
    type: "search_engine",
    activeEngine: "SeekEngine",
    history: [],

    search(query) {
        if (!query || !query.trim()) return "Empty query ignored";

        const timestamp = new Date().toLocaleTimeString();
        this.history.push({ query, timestamp });

        console.log(`[SeekEngine] Searching via ${this.activeEngine}: "${query}"`);
        console.log(`[Seek] 👁️ Seek is tracking query: "${query}"`);

        return {
            engine: this.activeEngine,
            query: query,
            status: "Search Dispatched",
            tracking: true
        };
    },

    setEngine(engineName) {
        this.activeEngine = engineName;
        console.log(`[SeekEngine] Switched default engine to: ${engineName}`);
    },

    getHistory() {
        return this.history;
    }
};

Monument.register("seek", Seek);
