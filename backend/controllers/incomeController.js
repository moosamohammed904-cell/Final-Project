import incomeModel from "../models/incomeModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dataFilter.js";

// Add income
export async function addIncome(req, res) {
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const newIncome = new incomeModel({
            userId,
            description,
            amount,
            category,
            date: new Date(date)
        });

        await newIncome.save();

        res.status(201).json({
            success: true,
            message: "Income added successfully!"
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

// Get all income for logged-in user
export async function getAllIncome(req, res) {
    const userId = req.user._id;

    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });
        res.json({
            success: true,
            data: income
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Update an income record
export async function updateIncome(req, res) {
    const { id } = req.params; // Fixed syntax error
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;

    try {
        const updateData = {};
        if (description) updateData.description = description;
        if (amount) updateData.amount = amount;
        if (category) updateData.category = category;
        if (date) updateData.date = new Date(date);

        const updatedIncome = await incomeModel.findOneAndUpdate(
            { _id: id, userId },
            updateData,
            { new: true }
        );

        if (!updatedIncome) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }

        res.json({
            success: true,
            message: "Income updated successfully.",
            data: updatedIncome // Fixed typo (was 'date')
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Delete an income record
export async function deleteIncome(req, res) {
    const userId = req.user._id;

    try {
        // Updated to ensure users can only delete their own income records
        const income = await incomeModel.findOneAndDelete({ _id: req.params.id, userId });

        if (!income) {
            return res.status(404).json({
                success: false,
                message: "Income not found"
            });
        }

        return res.json({
            success: true,
            message: "Income deleted successfully!"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
}

// Download income data in an Excel sheet (Using memory buffer)
export async function downloadIncomeExcel(req, res) {
    const userId = req.user._id;

    try {
        const income = await incomeModel.find({ userId }).sort({ date: -1 });

        const plainData = income.map((inc) => ({
            Description: inc.description,
            Category: inc.category,
            Amount: inc.amount,
            Date: new Date(inc.date).toLocaleDateString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Income");

        // Generate buffer instead of writing to disk
        const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Disposition", "attachment; filename=income_details.xlsx");
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

// Get income overview
export async function getIncomeOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);

        const incomes = await incomeModel.find({
            userId, // Fixed typo (was 'userID')
            date: { $gte: start, $lte: end },
        }).sort({ date: -1 });

        const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
        const numberOfTransactions = incomes.length;
        const recentTransactions = incomes.slice(0, 10);

        res.json({
            success: true,
            data: { // Fixed typo (was 'date')
                totalIncome,
                averageIncome,
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