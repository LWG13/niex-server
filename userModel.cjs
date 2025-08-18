const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now }
})

const userData = mongoose.model("user", userSchema)
module.exports = userData;