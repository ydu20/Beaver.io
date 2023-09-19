


const savePanel = async (req, res) => {

    return res.status(200).json('savePanel called');
}

const loadPanel = async (req, res) => {

    return res.status(200).json('loadPanel called');
}




module.exports = {
    savePanel, 
    loadPanel,
}