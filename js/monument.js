/*
    MONUMENT CORE
    Central controller & module registry.
*/

const Monument = {

    version: "0.2.0",
    modules: {},

    // Register module and mark it awake
    register(name, module) {
        this.modules[name] = {
            instance: module,
            awake: true,
            registeredAt: Date.now()
        };

        console.log(`[Monument] Loaded & Awake: ${name.toUpperCase()}`);
    },

    get(name) {
        return this.modules[name] ? this.modules[name].instance : null;
    },

    // Check if a module or DOORS entity is currently awake
    isAwake(name) {
        return !!(this.modules[name] && this.modules[name].awake);
    },

    // Get array of all active/awake module names
    getAwakeModules() {
        return Object.keys(this.modules).filter(key => this.modules[key].awake);
    },

    // Print summary status of all registered modules & entities
    checkAwake() {
        const report = {};
        for (const [key, val] of Object.entries(this.modules)) {
            report[key] = {
                entity: val.instance.entityName || key,
                awake: val.awake,
                type: val.instance.type || "module"
            };
        }
        console.table(report);
        return report;
    },

    // Public APIs for console / external calls
    api: {
        ping: () => "Monument Core operational",
        getVersion: () => Monument.version,
        getAwakeCount: () => Monument.getAwakeModules().length,
        getEntities: () => Monument.get("bob") ? Monument.get("bob").getEntities() : []
    }
};


/* Non-working searchbar handler */
const searchBox = document.getElementById("search");
if (searchBox) {
    searchBox.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            console.log(`[Monument] Search is non-working. Input ignored: "${searchBox.value}"`);
        }
    });
}
