const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set (skipping connection)');
  }

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'shelby_advisor',
  });
  console.log('MongoDB connected');
}

module.exports = { connectDB };
