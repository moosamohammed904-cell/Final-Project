import mongoose from "mongoose";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const hostDomain = "cluster0.xdt36p5.mongodb.net";
  const username = "moosamohammed904_db_user";
  const password = "06PbDEl3Tug7HJNL";
  const dbName = "Expense";

  const fallbackUri = `mongodb+srv://${username}:${password}@${hostDomain}/${dbName}?retryWrites=true&w=majority`;
  const uri = process.env.MONGODB_URI || fallbackUri;

  try {
    await mongoose.connect(uri);
    console.log("DB CONNECTED");
  } catch (error) {
    console.error("DB Connection Failed:", error.message);
    throw error;
  }
};