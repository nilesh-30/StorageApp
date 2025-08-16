import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoute from "./routes/directoryRoute.js";
import fileRoute from "./routes/fileRoute.js";
import userRoute from "./routes/userRoute.js";
import checkAuth from "./middlewares/auth.js";
import { connectDB } from "./db.js";

try {
    const db = await connectDB();
    
    const app = express();
    const port = 4000;
    
    app.use(express.json());
    app.use(cookieParser())
    app.use(cors({
        origin: "http://localhost:5173",
        credentials: true
    }));
    
    app.use((req, res, next) => {
        req.db = db;
        next()
    })
    
    app.use("/directory", checkAuth, directoryRoute)
    app.use("/file", checkAuth, fileRoute)
    app.use("/user", userRoute)
    
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({ message: "Something went wrong!" })
    })
    
    app.listen(port, () => {
        `Server is running on port: ${port}`
    })
} catch (err) {
    console.log("Could not connect to databaes!");
    console.log(err)
}