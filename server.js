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
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log("Connected to MongoDB");

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

    const auth = require('./middleware/auth.middleware');
    app.use(auth);

    const schema = require('./schema/index');

    app.use(
      "/graphql",
      graphqlHTTP((req, res) => ({
        schema,
        graphiql: true,
        context: { req, res }
      }))
    );

    app.get("/", (req, res) => {
      res.send("Hare Krishna");
    });

    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });

  } catch (err) {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  }
}

start();