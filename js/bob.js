
/*
    BOB

    v0.1 temporary database.

    This is deliberately local for now.
    Later, Monument can ask Moonlight
    to communicate with the real server.
*/

const Bob = {

    name: "Bob",

    data: [
        {
            name: "Monument",
            type: "core"
        },

        {
            name: "Moonlight",
            type: "connection"
        },

        {
            name: "Bob",
            type: "database"
        }
    ],

    async search(query) {

        const text = query.toLowerCase();

        return this.data.filter(item =>
            item.name.toLowerCase().includes(text)
        );
    }
};

Monument.register("bob", Bob);
