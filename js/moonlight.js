
/*
    MOONLIGHT

    v0.1:
    Just a connection test.

    Later this can become the thing responsible for:
        - server connections
        - authentication
        - module communication
        - API requests
        - connection status
*/

const Moonlight = {

    name: "Moonlight",

    connected: false,

    async connect() {

        console.log("[Moonlight] Connecting...");

        /*
            Server connection will go here later.
        */

        this.connected = true;

        console.log("[Moonlight] Connection established.");

        return true;
    }
};

Monument.register("moonlight", Moonlight);

Moonlight.connect();
