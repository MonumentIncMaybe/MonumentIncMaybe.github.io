/*
    MONUMENT CORE

    Monument is the central controller.

    Other modules:
        Moonlight -> connection layer
        Bob      -> database

    Future modules:
        Scribbles
        Seek
        Starlight
*/

const Monument = {

    version: "0.1.0",

    modules: {},

    register(name, module) {
        this.modules[name] = module;

        console.log(`[Monument] Loaded: ${name}`);
    },

    get(name) {
        return this.modules[name];
    },

    async search(query) {
        if (!query.trim()) {
            return [];
        }

        const bob = this.get("bob");

        if (!bob) {
            console.warn("[Monument] Bob is offline.");
            return [];
        }

        return await bob.search(query);
    }
};


/*
    Search UI
*/

const searchBox = document.getElementById("search");
const results = document.getElementById("results");

searchBox.addEventListener("input", async () => {

    const query = searchBox.value;

    const data = await Monument.search(query);

    results.innerHTML = "";

    for (const item of data) {

        const result = document.createElement("div");

        result.textContent = item.name;

        results.appendChild(result);
    }
});
