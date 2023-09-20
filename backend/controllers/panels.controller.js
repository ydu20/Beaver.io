const Panel = require('../models/panel.model');

const savePanel = async (req, res) => {

    const query = {id: req.body.id};
    const update = {
        ownerEmail: req.body.ownerEmail,
        x: req.body.x,
        y: req.body.y,
        zoom: req.body.zoom,
        tiles: req.body.tiles,
    };
    const options = {upsert: true}

    Panel.findOneAndUpdate(query, update, options)
        .then(() => res.json('Panel saved!'))
        .catch(err => res.status(400).json('Error: ' + err));
}

const loadPanel = async (req, res) => {

    const id = req.params.id;
    const panel = await Panel.findOne({id: id});

    if (!panel) {
        res.status(400).json('Panel not found.');
    } else {
        res.json(panel);
    }
}


module.exports = {
    savePanel, 
    loadPanel,
}