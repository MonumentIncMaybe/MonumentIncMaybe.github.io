/*
    SCRIBBLES (Community Module)
    Handles paper community messages, channels, and doodles.
*/

const Scribbles = {
    name: "scribbles",
    entityName: "Scribbles",
    type: "community",
    isOpen: false,

    channels: [
        { id: "general", name: "general-chat" },
        { id: "doodles", name: "scribble-doodles" },
        { id: "entity-sightings", name: "entity-sightings" }
    ],

    openCommunity() {
        this.isOpen = true;
        console.log("[Scribbles] Opening Scribbles' Community Hub...");
        console.log("[Scribbles] Connected Channels:", this.channels.map(c => `#${c.name}`).join(", "));
        return "Scribbles Community Interface Active";
    },

    closeCommunity() {
        this.isOpen = false;
        console.log("[Scribbles] Closed Community Hub.");
    },

    postMessage(channel, text) {
        console.log(`[Scribbles Community] [#${channel}] Doodle Note: "${text}"`);
        return true;
    }
};

Monument.register("scribbles", Scribbles);
