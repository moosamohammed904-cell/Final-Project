import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dataFilter.js";
import XLSX from 'xlsx';

/// add expense
export async function addExpense(req,res) {
        const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }
            const newExpense = new expenseModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });

        await newExpense.save();

        res.status(201).json({
            success: true,
            message: "Expense added successfully!"
        });
    }
       catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

//// to all expense
export async function getAllExpense(req,res){
        const userId = req.user._id;

    try {
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });
        res.json(expense);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

///// Update an expense
  export async function updateExpense(req, res) {
    const { id } = req.params;
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        const updateData = {};
        if (description) updateData.description = description;
        if (amount) updateData.amount = amount;
        if (category) updateData.category = category;
        if (date) updateData.date = new Date(date);

        const updatedExpense = await expenseModel.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true, runValidators: true } 
        );

        if (!updatedExpense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found" 
            });
        }

        res.json({
            success: true,
            message: "Expense updated successfully.", 
            data: updatedExpense 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

//// delete an expense
export async function deleteExpense(req,res){
        try {
        const expense = await expenseModel.findOneAndDelete({ _id: req.params.id, userId });
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }

        return res.json({
            success: true,
            message: "Expense deleted successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// download excel for expense
export async function downloadExpenseExcel(req, res) {
    const userId = req.user._id;

    try {
        const expense = await expenseModel.find({ userId }).sort({ date: -1 });

        const plainData = expense.map((exp) => ({
            Description: exp.description,
            Category: exp.category,
            Amount: exp.amount,
            Date: new Date(exp.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Expense");

        // Generate buffer instead of writing to disk
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Disposition", "attachment; filename=expense_details.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Get overview of expenses
export async function getExpenseOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        // Fetch expenses matching query
        const expenses = await expenseModel.find({
            userId,
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        const totalExpense = expenses.reduce((acc, cur) => acc + cur.amount, 0);
        const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
        const numberOfTransactions = expenses.length;
        const recentTransactions = expenses.slice(0, 5);

        res.json({
            success: true,
            data: {
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}
