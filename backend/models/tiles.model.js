const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SchemaTypes = mongoose.Schema.Types;

const tileSchema = new Schema({

    id: {
        type: String,
        required: true,
    },
    PanelId: {
        type: String,
        required: true,
    },
    x: {
        type: SchemaTypes.Double,
        required: true,
    },
    y: {
        type: SchemaTypes.Double,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    output: {
        type: String,
        required: true,
    }, 
    zIndex: {
        type: Number,
        required: true,
    },

});

const Tiles = mongoose.model('Tiles', tileSchema);

module.exports = Tiles;