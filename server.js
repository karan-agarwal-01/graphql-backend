require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI

async function start() {
  try {
    mongoose.set('bufferCommands', false)

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('Connected to MongoDB');

    const auth = require('./middleware/auth.middleware');

    app.use(auth)

    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}/graphql`);
    });

  } catch (err) {
    console.error('Error connecting to DB', err);
    process.exit(1);
  }
}

start();