import mongoose from "mongoose";

export const connectDB = async () => {
const hostDomain = "cluster0.xdt36p5.mongodb.net";
const username = "moosamohammed904_db_user";
const password = "06PbDEl3Tug7HJNL";
const dbName = "Expense";

const uri=`mongodb+srv://${username}:${password}@${hostDomain}/${dbName}?retryWrites=true&w=majority`;


try {
    await mongoose.connect(
      "mongodb+srv://moosamohammed904_db_user:06PbDEl3Tug7HJNL@cluster0.xdt36p5.mongodb.net/Expense"
    );
    console.log("DB CONNECTED");
  } catch (error) {
    console.error("DB Connection Failed:", error.message);
}
};