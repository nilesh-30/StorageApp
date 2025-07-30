import express from "express";
import { createWriteStream } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import filesData from "../filesDB.json" with {type: "json"};
import directoriesData from "../directoriesDB.json" with {type: "json"};

const route = express.Router()

// Read
route.get('/:id', (req, res, next) => {
    try {
        const { id } = req.params
        const fileData = filesData.find((file) => file.id === id)

        // Check if file exists
        if (!fileData) {
            return res.status(404).json({ error: "File not found!" });
        }

        // Check parent directory ownership
        const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId)
        if (!parentDir) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }
        if(parentDir.userId !== req.user.id) {
            return res.status(401).json({ err: "You don't have access to this file" })
        }

        // Handling the download functionality
        const filePath = `${process.cwd()}/storage/${id}${fileData.extension}`

        if (req.query.action === "download") {
            res.download(filePath, fileData.name)
        }

        // Send file
        return res.sendFile(filePath)
    } catch (error) {
        next(err)
    }
})

// Create
route.post('/:parentDirId?', (req, res, next) => {
    try {
        const user = req.user;
        const parentDirId = req.params.parentDirId || user.rootDirId;
        const parentDirData = directoriesData.find((directory) => directory.id === parentDirId);

        // Check if parent directory exists
        if (!parentDirData) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }

        // Checks the directory ownweship
        if (parentDirData.userId !== req.user.id) {
            return res
                .status(403)
                .json({ error: "You do not have permission to upload to this directory." });
        }

        const filename = req.headers.filename || "untitled";
        const id = crypto.randomUUID();
        const extension = path.extname(filename);
        const fullFileName = `${id}${extension}`;
        const writeStream = createWriteStream(`./storage/${fullFileName}`);
        req.pipe(writeStream);

        req.on('end', async () => {
          filesData.push({
            id,
            extension,
            name: filename,
            parentDirId
          })
          parentDirData.files.push(id)
          await writeFile("./filesDB.json", JSON.stringify(filesData))
          await writeFile("./directoriesDB.json", JSON.stringify(directoriesData))
          res.json( {message: "File Uploaded"})
        })
    } catch (err) {
        next(err)
    }
})

// Delete
route.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params
        const fileIndex = filesData.findIndex((file) => file.id === id) 

        // Check if file exists
        if (fileIndex === -1) {
            return res.status(404).json({ err: "File not found" })
        }

        const fileData = filesData[fileIndex]

        // Check for directory ownership
        const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId)
        if (!parentDir) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }
        if (parentDir.userId !== req.user.id) {
            return res.status(403).json({ error: "You don't have access to this file." });
        }

        // Remove file from filesystem
        await rm(`./storage/${id}${fileData.extension}`, { recursive: true})
        
        // Remove file from DB
        parentDir.files = parentDir.files.filter((file) => file !== id)
        filesData.splice(fileIndex, 1)

        // Write changes to json file
        await writeFile("./filesDB.json", JSON.stringify(filesData))
        await writeFile("./directoriesDB.json", JSON.stringify(directoriesData))

        return res.json({ message: "File Deleted"})
    } catch (err) {
        next(err)
    }
})

// Rename
route.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params
        const fileData = filesData.find((file) => file.id === id)

        // Check if file exist
        if (!fileData) {
            return res.status(404).json({ error: "File not found!" });
        }

        // Check for directory ownership
         const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId);
        if (!parentDir) {
            return res.status(404).json({ error: "Parent directory not found!" });
        }
        if (parentDir.userId !== req.user.id) {
            return res.status(403).json({ error: "You don't have access to this file." });
        }

        // Perform Rename
        fileData.name = req.body.newFilename
        await writeFile("./filesDB.json", JSON.stringify(filesData))

        return res.json({ message: "File Renamed"})
    } catch (err) {
        next(err)
    }
})

export default route;