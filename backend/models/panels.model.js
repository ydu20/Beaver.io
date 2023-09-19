const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SchemaTypes = mongoose.Schema.Types;

const panelSchema = new Schema({
    
    id: {
        type: String,
        required: true,
        unique: true,
    },
    ownerEmail: {
        type: String,
        required: true,
        trim: true
    },
    x: {
        type: SchemaTypes.Double,
        required: true,
    },
    y: {
        type: SchemaTypes.Double,
        required: true,
    },
    zoom: {
        type: SchemaTypes.Double,
        required: true,
    },
    tiles: [
        {}
    ],

});

const Panels = mongoose.model('Panels', panelSchema);

module.exports = Panels;