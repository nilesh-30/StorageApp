import { ObjectId } from "mongodb"

export default async function checkAuth(req, res, next) {
  const { uid } = req.cookies
  const db = req.db;
  const user = await db.collection("users").findOne({ _id: new ObjectId(uid) })

  if (!uid || !user) {
    return res.status(401).json({ err: "Not logged!" })
  }
  req.user = user
  next()
}