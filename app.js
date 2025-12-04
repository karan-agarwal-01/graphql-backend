const express = require('express');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { graphqlHTTP } = require('express-graphql');
const { authTypeDefs, authResolvers } = require('./schema/auth.index');
const { profileTypeDefs, profileResolvers } = require('./schema/profile.index');
const auth = require('./middleware/auth.middleware');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const uploadRoute = require('./routes/upload.routes');
const { categoryTypeDefs, categoryResolvers } = require('./schema/category.index');
const { productTypeDefs, productResolvers } = require('./schema/product.index');
const { cartResolvers, cartTypeDefs } = require('./schema/cart.index');
const { orderTypeDefs, orderResolvers } = require('./schema/order.index');
const stripeWebhook = require('./routes/webhook.routes');
const { paymentTypeDefs, paymentResolvers } = require('./schema/payment.index');

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use("/stripe", stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(auth);

app.use("/upload", uploadRoute);

const typeDefs = mergeTypeDefs([authTypeDefs, profileTypeDefs, categoryTypeDefs, productTypeDefs, cartTypeDefs, orderTypeDefs, paymentTypeDefs])
const resolvers = mergeResolvers([authResolvers, profileResolvers, categoryResolvers, productResolvers, cartResolvers, orderResolvers, paymentResolvers])

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
})

app.use(
    "/graphql",
    graphqlHTTP((req, res) => ({
        schema,
        graphiql: true,
        context: { req, res }
    }))
);

app.get('/', (req, res) => res.send('Hare Krishna'));

module.exports = app;