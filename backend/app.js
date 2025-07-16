import express from "express";
import cors from "cors";
import directoryRoute from "./routes/directoryRoute.js";
import fileRoute from "./routes/fileRoute.js";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

app.use("/directory", directoryRoute)
app.use("/files", fileRoute)

app.listen(port, () => {
    `Server is running on port: ${port}`
})