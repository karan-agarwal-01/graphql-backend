const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const uploadRoute = require('./routes/upload.routes');
const stripeWebhook = require('./routes/webhook.routes');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema/index');

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

app.use("/graphql", graphqlHTTP((req, res) => ({
    schema,
    graphiql: true,
    context: { req, res }  
})))

app.get('/', (req, res) => res.send('Hare Krishna'));

module.exports = app;