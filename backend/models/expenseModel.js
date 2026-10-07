import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be a positive number"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Match your User model name (capitalized)
      required: true,
      index: true, // Improves query speed when searching by userId
    },
    type: {
      type: String,
      default: "expense",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overwrite model error during hot reloads
const expenseModel =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default expenseModel;