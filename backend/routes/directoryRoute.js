import express from "express";
import { rm, writeFile } from "node:fs/promises"
import directoriesData from "../directoriesDB.json" with {type: "json"};
import filesData from "../filesDB.json" with {type: "json"};

const route = express.Router()

// Read
// route.get("/:id?", async (req, res, next) => {
//   const { id } = req.params

//   try {
//     if (!id) {
//       const directoryData = directoriesData[0]
//       const files = directoryData.files.map((fileId) =>
//         filesData.find((file) => file.id === fileId)
//       )
//       const directories = directoryData.directories.map((dirId) =>
//         directoriesData.find((dir) => dir.id === dirId)
//       ).map(({ id, name }) => ({ id, name }))
//       console.log({ ...directoryData, files, directories })
//       res.json({ ...directoryData, files, directories })
//     }
//     else {
//       const directoryData = directoriesData.find((file) => file.id === id)
//       console.log(directoryData)
//       const files = directoryData.files.map((fileId) =>
//         filesData.find((file) => file.id === fileId)
//       )
//       const directories = directoryData.directories.map((dirId) =>
//         directoriesData.find((dir) => dir.id === dirId)
//       ).map(({ id, name }) => ({ id, name }))
//       console.log({ ...directoryData, files, directories })
//       res.json({ ...directoryData, files, directories })
//     }
//   } catch (err) {
//     next(err)
//   }
// })

// Read
route.get("/:id?", async (req, res, next) => {
  try {
    const user = req.user
    const id  = req.params.id || user.rootDirId

    // Find the directory and verify ownership
    const directoryData = directoriesData.find((directory) => directory.id === id && directory.userId === user.id)
    if(!directoryData) {
      return res.status(404).json({ message: "Directory not found or you do noot have access to it!" })
    }
    
    const files = directoryData.files.map((fileId) =>
      filesData.find((file) => file.id === fileId)
    )
    const directories = directoryData.directories.map((dirId) =>
      directoriesData.find((dir) => dir.id === dirId)
    ).map((({ id, name }) => ({ id, name })))
    
    return res.status(200).json({ ...directoryData, files, directories })
  } catch (err) {
    next(err)
  }
});

// Create
route.post('/:parentDirId?', async (req, res, next) => {
  const user = req.user
  const parentDirId = req.params.parentDirId || user.rootDirId
  const dirname = req.headers.dirname || 'New Folder'
  const id = crypto.randomUUID()
  const parentDir = directoriesData.find((dir) => dir.id === parentDirId)

  // Check if parent directory exist
  if (!parentDir) {
    return res.status(404).json({ message: "Parent Directory Does not exist!" })
  }

  parentDir.directories.push(id)
  directoriesData.push({
    id,
    name: dirname,
    parentDirId,
    userId: user.id,
    files: [],
    directories: []
  })
  try {
    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData))
    return res.json({ message: "Directory Created" })
  } catch (err) {
    next(err)
  }
})

// Rename
route.patch('/:id', async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { newDirName } = req.body;

  const dirData = directoriesData.find((dir) => dir.id === id)
  if (!dirData) return res.status(404).json({ message: "Directory not found!" });

  // Check the directory ownership
  if (dirData.userId !== user.id) {
    return res.status(403).json({ message: "You are not authorized to rename this directory!" });
  }

  dirData.name = newDirName
  try {
    await writeFile('./directoriesDB.json', JSON.stringify(directoriesData))
    res.json({ message: "Directory Renamed!" })
  } catch (err) {
    next(err)
  }
})

// Delete
// route.delete('/:id', async (req, res) => {
//   const user = req.user;
//   const { id } = req.params;

//   try {
//     const dirIndex = directoriesData.findIndex((directory) => directory.id === id)

//     // Check if the directory exist
//     if (dirIndex === -1) return res.status(404).json({ message: "Directory not found!" });

//     const directoryData = directoriesData[dirIndex]

//     // Check if the directory belongs to the user
//     if (directoryData.userId !== user.id) {
//       return res.status(403).json({ message: "You are not authorized to delete this directory!" });
//     }

//     // Remove directory from database
//     directoriesData.splice(dirIndex, 1)

//     // Removing all directory files
//     for await (const fileId of directoryData.files) {
//       const fileIndex = filesData.findIndex((file) => file.id === fileId)
//       const fileData = filesData[fileIndex]
//       await rm(`./storage/${fileId}/${fileData.extension}`)
//       filesData.splice(fileIndex, 1)
//     }

//     // Removing all child directory
//     for await (const dirId of directoryData.directories) {
//       const dirIndex = directoriesData.findIndex(({ id }) => id === dirId)
//       directoriesData.splice(dirIndex, 1)
//     }

//     // Remove directory id from parent directory
//     const parentDirData = directoriesData.find((dirData) => dirData.id === directoryData.parentDirId)
//     parentDirData.directories = parentDirData.directories.filter((dirId) => dirId !== id)

//     // Writing operation in json file
//     await writeFile('./filesDB.json', JSON.stringify(filesData))
//     await writeFile('./directoriesDB.json', JSON.stringify(directoriesData))
//     res.json({ message: "Directory Deleted!" });
//   } catch (err) {
//     res.json({ err: err.message });
//   }
// })


// Helper function to recursively delete a directory and its contents
async function deleteDirectoryRecursively(directoryId) {
  const dirIndex = directoriesData.findIndex((dir) => dir.id === directoryId)
  if (dirIndex === -1) return;

  const directoryData = directoriesData[dirIndex];

  // 1. Delete all files in the directory
  for (const fileId of directoryData.files) {
    const fileIndex = filesData.findIndex((file) => file.id === fileId);
    if (fileIndex !== -1) {
      const fileData = filesData[fileIndex];
      const filePath = `./storage/${fileData.id}${fileData.extension}`;
      try {
        await rm(filePath);
      } catch (err) {
        console.error(`Failed to delete file ${filePath}: ${err.message}`);
      }
      filesData.splice(fileIndex, 1);
    }
  }

  // 2. Recursively delete all subdirectories
  for (const childDirId of directoryData.directories) {
    await deleteDirectoryRecursively(childDirId);
  }

  // 3. Remove directory itself from the list
  directoriesData.splice(dirIndex, 1);
}

route.delete('/:id', async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  try {
    const dirIndex = directoriesData.findIndex((directory) => directory.id === id);

    // Check if the directory exists
    if (dirIndex === -1) return res.status(404).json({ message: "Directory not found!" });

    const directoryData = directoriesData[dirIndex];

    // Check if the directory belongs to the user
    if (directoryData.userId !== user.id) {
      return res.status(403).json({ message: "You are not authorized to delete this directory!" });
    }

    // 4. Remove this directory's ID from its parent directory
    const parentDirData = directoriesData.find((dirData) => dirData.id === directoryData.parentDirId);
    if (parentDirData) {
      parentDirData.directories = parentDirData.directories.filter((dirId) => dirId !== id);
    }

    // 5. Recursively delete the directory and all contents
    await deleteDirectoryRecursively(id);

    // 6. Write updated data to JSON files
    await writeFile('./filesDB.json', JSON.stringify(filesData));
    await writeFile('./directoriesDB.json', JSON.stringify(directoriesData));

    res.json({ message: "Directory and all its contents deleted successfully!" });
  } catch (err) {
    res.json({ err: err.message });
  }
});


export default route;