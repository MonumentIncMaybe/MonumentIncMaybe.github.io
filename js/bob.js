/*
    BOB
    Database layer storing DOORS Entities data.
*/

const Bob = {

    name: "bob",
    entityName: "Bob",
    type: "database",

    // DOORS entities database
    entities: [
        { id: "rush", name: "Rush", danger: "Medium", awake: true },
        { id: "ambush", name: "Ambush", danger: "High", awake: true },
        { id: "seek", name: "Seek", danger: "High", awake: true },
        { id: "figure", name: "Figure", danger: "Extreme", awake: true },
        { id: "screech", name: "Screech", danger: "Low", awake: true },
        { id: "eyes", name: "Eyes", danger: "Medium", awake: true },
        { id: "halt", name: "Halt", danger: "Medium", awake: true },
        { id: "hide", name: "Hide", danger: "Medium", awake: true },
        { id: "jack", name: "Jack", danger: "Low", awake: true },
        { id: "dupe", name: "Dupe", danger: "Medium", awake: true },
        { id: "guiding_light", name: "Guiding Light", danger: "None", awake: true },
        { id: "curious_light", name: "Curious Light", danger: "None", awake: true },
        { id: "bob", name: "Bob", danger: "None", awake: true },
        { id: "jeff", name: "Jeff", danger: "None", awake: true },
        { id: "el_goblino", name: "El Goblino", danger: "None", awake: true }
    ],

    // APIs
    getEntities() {
        return this.entities;
    },

    getEntityById(id) {
        return this.entities.find(e => e.id === id);
    },

    isEntityAwake(id) {
        const entity = this.getEntityById(id);
        return entity ? entity.awake : false;
    }
};

Monument.register("bob", Bob);
