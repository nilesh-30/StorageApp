import express from "express";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import cors from "cors";

const app = express();
const port = 4000;

app.use(express.json());
app.use(cors());

app.get("/directory/?*", async (req, res) => {
    const resData = []
    const { 0: dirname } = req.params 
    console.log(dirname)
    const fullDirPath = `./storage/${dirname ? dirname : ""}`
    const fileList = await readdir(fullDirPath);
    for(const item of fileList) {
        const stats = await stat(`${fullDirPath}/${item}`)
        resData.push({ name: item, isDirectory: stats.isDirectory() })
    }
    res.json(resData);
})

app.post('/directory/*', async (req, res) => {
    const { 0: dirPath } = req.params
    console.log(dirPath)
    await mkdir(`./storage/${dirPath}`, { recursive: true })
    res.json({ message: "Directory Created" })
})

app.get('/files/*', (req, res) => {
    const { 0: filePath } = req.params
    if (req.query.action === "download") {
        res.set("Content-Disposition", "attachment")
    }
    res.sendFile(`${import.meta.dirname}/storage/${filePath}`)
})

app.post('/files/*', (req, res) => {
    const { 0: dirPath } = req.params
    const writeStream = createWriteStream(`./storage/${dirPath}`)
    req.pipe(writeStream)
    req.on('end', () => {
        res.json( {message: "File Uploaded"})
    })
})

app.delete('/files/*', async (req, res) => {
    const { 0: dirPath } = req.params
    const filePath = `${import.meta.dirname}/storage/${dirPath}`
    await rm(filePath, { recursive: true})
    res.json({ message: "File Deleted"})
})

app.patch('/files/*', async (req, res) => {
    const { 0: dirPath } = req.params
    await rename(`./storage/${dirPath}`, `./storage/${req.body.newFilename}`)
    res.json({ message: "File Renamed"})
})

app.listen(port, () => {
    `Server is running on port: ${port}`
})