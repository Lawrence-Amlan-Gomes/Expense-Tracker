import mongoose from "mongoose";

export async function dbConnect() {
  try {
    // FIXED: Ensure MONGODB_URI is defined
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(uri);
    console.log("Connected");
    return conn;
  } catch (err) {
    console.log(err);
  }
}