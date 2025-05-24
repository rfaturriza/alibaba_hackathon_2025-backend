const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

let isConnected = false;

async function connectMongo() {
  if (isConnected) return mongoose;
  await mongoose.connect(MONGO_URI);
  isConnected = true;
  return mongoose;
}

module.exports = { mongoose, connectMongo };
