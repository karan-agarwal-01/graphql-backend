const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const uploadRoute = require('./routes/upload.routes');
const stripeWebhook = require('./routes/webhook.routes');

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/stripe", stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/upload", uploadRoute);

app.get('/', (req, res) => res.send('Hare Krishna'));

module.exports = app;