const mongoose = require('mongoose');

/**
 * Connects to MongoDB with retry logic.
 * Call once from server.js before starting the HTTP server.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:          45000,
  };

  try {
    await mongoose.connect(uri, options);
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => console.warn('[DB] MongoDB disconnected'));
  mongoose.connection.on('reconnected',  () => console.info('[DB] MongoDB reconnected'));
}

module.exports = connectDB;