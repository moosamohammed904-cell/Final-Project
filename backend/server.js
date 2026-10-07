import express from 'express';
import cors from 'cors';
import  'dotenv/config';
import { connectDB } from './config/db.js';

import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';

const app = express()
const port = 4000;


///MIDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended:true }));



//DB
const startServer = async () => {
  try {
    // Wait for DB connection BEFORE starting server listening
    await connectDB();

//Routes
app.use("/api/user", userRouter)
app.use("/api/income", incomeRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/dashboard", dashboardRouter);

app.get('/',(req, res) => {
    res.send("API WORKING");
});

app.listen(port, () => {
      console.log(`Server Started on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
};

startServer();