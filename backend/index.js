// .env file
require('dotenv').config();

// Imports
const express = require("express");
const mongoose = require("mongoose");


// Express app
const app = express();
const port = process.env.PORT;

// Routes
app.use("/panels", require('./routes/panels.routes'));

// Connect to db
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(port, () => console.log(`Listening on http://localhost:${port} ...`));
    })
    .catch((error) => {
        console.log(error);
    })
