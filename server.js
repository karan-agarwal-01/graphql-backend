require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { graphqlHTTP } = require('express-graphql');

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    const auth = require('./middleware/auth.middleware');
    const schema = require('./schema/index')

    app.use(auth)

    app.use("/graphql", graphqlHTTP((req, res) => ({
      schema,
      graphiql: true,
      context: { req, res }  
    })))

    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });

  } catch (err) {
    console.error('Error connecting to DB', err);
    process.exit(1);
  }
}

start();