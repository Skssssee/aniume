const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Ensuring Mongoose connects to the specific database 'rajmmamn' 
    // to prevent it defaulting to 'test' or 'Cluster0'
    const dbName = process.env.DATABASE_NAME || 'rajmmamn';
    
    await mongoose.connect(process.env.MONGO_URI, {
        dbName: dbName
    });
    
    console.log(`✅ MongoDB Connected to: ${dbName}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
