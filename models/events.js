const mongoose = require('mongoose');

const eventsSchema = new mongoose.Schema({
    //lagay values dito
})

const Events = mongoose.model("events", eventsSchema);
module.exports = Events;