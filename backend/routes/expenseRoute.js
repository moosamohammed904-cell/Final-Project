import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { addExpense, getAllExpense, getExpenseOverview, downloadExpenseExcel, updateExpense, deleteExpense } from '../controllers/expenseController.js';

const expenseRouter = express.Router();

// 1. Static / Specific routes first
expenseRouter.post("/add", authMiddleware, addExpense);
expenseRouter.get("/get", authMiddleware, getAllExpense);
expenseRouter.get("/overview", authMiddleware, getExpenseOverview);
expenseRouter.get("/downloadexcel", authMiddleware, downloadExpenseExcel);

// 2. Dynamic / Parameterized routes last
expenseRouter.put("/update/:id", authMiddleware, updateExpense);
expenseRouter.delete("/delete/:id", authMiddleware, deleteExpense);

export default expenseRouter;