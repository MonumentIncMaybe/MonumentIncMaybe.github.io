/*
    STARLIGHT (Star Arcade Entity Module)
    Handles Arcade games & mini-experiences.
*/

const Starlight = {
    name: "starlight",
    entityName: "Starlight",
    type: "arcade",

    launchArcade() {
        console.log("[Starlight] Launching Star Arcade...");
        // Arcade launch logic will go here
    }
};

Monument.register("starlight", Starlight);
