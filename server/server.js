import dotenv from'dotenv'
dotenv.config();
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import mongoose from "mongoose"
import connectDB from "./config/mongodb.js"
import authRouter from "./routes/authRoutes.js"
import userRouter from './routes/userRoute.js';
const app=express();
const port = process.env.PORT || 4000;
connectDB();

const allowedOrigins=['http://localhost:5173']
app.use(express.json());

app.use(cookieParser());
app.use(cors({origin:allowedOrigins,credentials: true}))
// Start the server
app.get('/',(req,res)=>res.send("API is working"))
app.use('/api/auth',authRouter)
app.use("/api/user",userRouter)
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});


