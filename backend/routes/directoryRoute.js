import express from "express";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const route = express.Router()

route.get("/?*", async (req, res) => {
    const resData = []
    const dirname = path.join("/", req.params[0])
    const fullDirPath = `./storage/${dirname ? dirname : ""}`
    const fileList = await readdir(fullDirPath);
    for(const item of fileList) {
        const stats = await stat(`${fullDirPath}/${item}`)
        resData.push({ name: item, isDirectory: stats.isDirectory() })
    }
    res.json(resData);
})

route.post('/*', async (req, res) => {
    const dirPath = path.join("/", req.params[0])
    await mkdir(`./storage/${dirPath}`, { recursive: true })
    res.json({ message: "Directory Created" })
})

export default route;