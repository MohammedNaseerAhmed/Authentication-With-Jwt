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

app.use(express.json());

app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "https://authentication-jwt-cokies.vercel.app",
  "https://authentication-jwt-cookie-parser.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Start the server
app.get('/',(req,res)=>res.send("API is working"))
app.use('/api/auth',authRouter)
app.use("/api/user",userRouter)
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});


