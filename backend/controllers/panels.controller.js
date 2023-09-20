const Panel = require('../models/panel.model');


const savePanel = async (req, res) => {

    var panel = new Panel({
        id: req.body.id,
        owerEmail: req.body.ownerEmail,
        x: req.body.x,
        y: req.body.y,
        zoom: req.body.zoom,
        tiles: req.body.tiles,
    });

    panel.save()
        .then(res => {

        })
        .catch(err => {

        });

    return res.status(200).json('savePanel called');
}

const loadPanel = async (req, res) => {


    return res.status(200).json('loadPanel called');
}




module.exports = {
    savePanel, 
    loadPanel,
}