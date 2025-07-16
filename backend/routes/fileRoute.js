import express from "express";
import { createWriteStream } from "node:fs";
import { rename, rm } from "node:fs/promises";
import path from "node:path";

const route = express.Router()

route.get('/*', (req, res) => {
    const filePath = path.join("/", req.params[0])
    if (req.query.action === "download") {
        res.set("Content-Disposition", "attachment")
    }
    res.sendFile(`${import.meta.dirname}/storage/${filePath}`)
})

route.post('/*', (req, res) => {
    const dirPath = path.join("/", req.params[0])
    const writeStream = createWriteStream(`./storage/${dirPath}`)
    req.pipe(writeStream)
    req.on('end', () => {
        res.json( {message: "File Uploaded"})
    })
})

route.delete('/*', async (req, res) => {
    const dirPath = path.join("/", req.params[0])
    const filePath = `${import.meta.dirname}/storage/${dirPath}`
    await rm(filePath, { recursive: true})
    res.json({ message: "File Deleted"})
})

route.patch('/*', async (req, res) => {
    const dirPath = path.join("/", req.params[0])
    await rename(`./storage/${dirPath}`, `./storage/${req.body.newFilename}`)
    res.json({ message: "File Renamed"})
})

export default route;