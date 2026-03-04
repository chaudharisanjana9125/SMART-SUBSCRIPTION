const mongoose = require('mongoose');

async function connectDB(mongoUri) {
  try {
    await mongoose.connect(mongoUri, { autoIndex: true });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

module.exports = { connectDB };
