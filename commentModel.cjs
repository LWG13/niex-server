const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema({
  userId : String,
  username: String,
  userImage: String,
  content: String,
  postId: String, 
  createdAt: { type: Date, default: Date.now }
})

const commentData = mongoose.model("comment", commentSchema)
module.exports = commentData;