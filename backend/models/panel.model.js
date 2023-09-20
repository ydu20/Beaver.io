const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tileSchema = new Schema({
    id: {
        type: Number,
        required: true,
    },
    x: {
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
    code: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                return (v !== null);
            },
            message: 'Missing "code" field'
        }
    },
    output: {
        type: String,
        required: false,
        validate: {
            validator: function(v) {
                return (v !== null);
            },
            message: 'Missing "output" field'
        }
    },
    zIndex: {
        type: Number,
        required: true,
    },
});

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
        type: Number,
        required: true,
    },
    y: {
        type: Number,
        required: true,
    },
    zoom: {
        type: Number,
        required: true,
    },
    tiles: {
        type:  [tileSchema],
        required: true,
    },
});


const Panel = mongoose.model('Panel', panelSchema)
module.exports = Panel;