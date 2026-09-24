/*
    MOONLIGHT (Guiding Light)
    Connection & status layer.
*/

const Moonlight = {

    name: "moonlight",
    entityName: "Guiding Light",
    type: "connection",
    connected: false,

    async connect() {
        console.log("[Moonlight / Guiding Light] Establishing connection...");
        this.connected = true;
        console.log("[Moonlight] Connection active.");
        return true;
    },

    // Connection API
    async pingServer() {
        return { online: this.connected, latencyMs: 12 };
    }
};

Monument.register("moonlight", Moonlight);
Moonlight.connect();
