import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';

import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB connection middleware for serverless invocations
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed on request:", error.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// Routes
app.use("/api/user", userRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/dashboard", dashboardRouter);

app.get('/', (req, res) => {
  res.send("API WORKING");
});

// Start listener when running standalone locally (not in serverless/Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`Server Started on http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);
    });
}

export default app;