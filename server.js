require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const uploadRoute = require('./routes/upload.routes');
const stripeWebhook = require('./routes/webhook.routes');
const { graphqlHTTP } = require('express-graphql');

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  try {
    // Connect to DB FIRST
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("Connected to MongoDB");

    // Create app AFTER DB connection
    const app = express();

    // CORS
    app.use(cors({
      origin: "http://localhost:5173",
      credentials: true
    }));

    // Stripe webhook (must be on top if using raw body)
    app.use("/stripe", stripeWebhook);

    // Body parser + cookies
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    // Uploads
    app.use("/upload", uploadRoute);

    // Load auth AFTER DB connected
    const auth = require('./middleware/auth.middleware');
    app.use(auth);

    // Load schema AFTER DB connect
    const schema = require('./schema/index');

    // GraphQL endpoint
    app.use(
      "/graphql",
      graphqlHTTP((req, res) => ({
        schema,
        graphiql: true,
        context: { req, res }
      }))
    );

    // Root
    app.get("/", (req, res) => {
      res.send("Hare Krishna");
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });

  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}

start();