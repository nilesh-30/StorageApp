import express from "express"
import checkAuth from "../middlewares/auth.js"

const route = express.Router()

// Get user details
route.get('/', checkAuth, (req, res) => {
  res.status(200).json({
    name: req.user.name,
    email: req.user.email
  });
});

// Register
route.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body
    const db = req.db;

    const user = await db.collection("users").findOne({ email });

    if (user) {
      return res.status(409).json({
        error: "User already exists",
        message: "A user with this email address already exists. Please try logging in or use a different email."
      });
    };

    const dirCollection = db.collection('directories');

    const userRootDir = await dirCollection.insertOne({
      name: `root-${email}`,
      parentDirId: null
    });

    const rootDirId = userRootDir.insertedId;
    const createdUser = await db.collection('users').insertOne({
      name,
      email,
      password,
      rootDirId,
    });

    const userId = createdUser.insertedId;
    await dirCollection.updateOne({ _id: rootDirId}, { $set: { userId }})
    
    res.status(201).json({ message: "User Registered" })
  } catch (err) {
    next(err)
  }
});

// Login
route.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body
    const db = req.db;
    const user = await db.collection("users").findOne({ email, password });

    if (!user) {
      return res.status(404).json({ err: "Invalid Credentials" })
    }

    res.cookie('uid', user._id.toString(), {
      httpOnly: true,
      maxAge: 60 * 1000 * 60 * 24 * 7
    });

    res.json({ message: 'Logged in' });
  } catch (err) {
    next(err)
  }
});

// Logout
route.post('/logout', (req, res) => {
  res.clearCookie('uid')
  res.status(204).end()
});

export default route;