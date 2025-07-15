import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./App.css";

function Directory() {
  const BASE_URL = "http://localhost:4000";
  const [directoryItems, setDirectoryItems] = useState([]);
  const [progress, setProgress] = useState(0);
  const [newFilename, setNewFilename] = useState("");
  const [newDirname, setNewDirname] = useState("");
  const { "*": dirPath } = useParams()
  // console.log(dirPath);

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirPath}`);
    const data = await response.json();
    setDirectoryItems(data);
    console.log(data)
  }
  useEffect(() => {
    getDirectoryItems();
  }, [dirPath]);

  async function uploadFile(e) {
    const file = e.target.files[0];
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/files/${dirPath}/${file.name}`, true);
    // xhr.setRequestHeader("filename", file.name);
    xhr.addEventListener("load", () => {
      console.log(xhr.response);
      getDirectoryItems();
    });
    xhr.upload.addEventListener("progress", (e) => {
      const totalProgress = (e.loaded / e.total) * 100;
      setProgress(totalProgress.toFixed(2));
    });
    xhr.send(file);
  }

  async function handleDirSubmit(e) {
    e.preventDefault()
    console.log(newDirname)
    console.log(`${BASE_URL}/directory${dirPath ? "/" + dirPath : ""}/${newDirname}`)
    await fetch(`${BASE_URL}/directory${dirPath ? "/" + dirPath : ""}/${newDirname}`, {
      method: "POST",
    })
    setNewDirname("")
    getDirectoryItems()
  }

  async function handleDelete(filename) {
    const response = await fetch(`${BASE_URL}/files/${dirPath}/${filename}`, {
      method: "DELETE"
    });
    const data = await response.text();
    console.log(data);
    getDirectoryItems();
  }

  async function renameFile(oldFilename) {
    console.log({ oldFilename, newFilename });
    setNewFilename(oldFilename);
  }

  async function saveFilename(oldFilename) {
    setNewFilename(oldFilename);
    const response = await fetch(`${BASE_URL}/files/${dirPath}/${oldFilename}`, {
      method: "PATCH",
      headers: {
        'Content-Type' : 'application/json'
      },
      body: JSON.stringify({ newFilename: `${dirPath}/${newFilename}` }),
    });
    const data = await response.text();
    console.log(data);
    setNewFilename("");
    getDirectoryItems();
  }

  return (
    <>
      <h1>My Files</h1>
      <input type="file" onChange={uploadFile} />
      <input
        type="text"
        onChange={(e) => setNewFilename(e.target.value)}
        value={newFilename}
      />
      <p>Progress: {progress}%</p>
      <form onSubmit={handleDirSubmit}>
        <input onChange={(e) => setNewDirname(e.target.value)} type="text" value={newDirname}/>
        <button type="Submit">Create</button>
      </form>
      <br />
      {directoryItems.map(({ name, isDirectory }, i) => (
        <div key={i}>
          {name} { isDirectory && <Link to={`./${name}`}>Open</Link> }
          {
            !isDirectory &&
            <span>
              <Link to={`${BASE_URL}/files/${dirPath}/${name}?action=open`}>Open</Link>{" "}
            </span>
          }
          {
            !isDirectory &&
            <Link to={`${BASE_URL}/files/${dirPath}/${name}?action=download`}>Download</Link>
          }
          <button onClick={() => renameFile(name)}>Rename</button>
          <button onClick={() => saveFilename(name)}>Save</button>
          <button onClick={() => {handleDelete(name)}}>Delete</button>
          <br />
        </div>
      ))}
    </>
  );
}

export default Directory;


