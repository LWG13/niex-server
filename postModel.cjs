const mongoose = require("mongoose");


const postSchema = new mongoose.Schema({
  title: String,
  imageTitle: String,
  context: String,
  category: String,
  
}, {
  timestamps: true
})

const postData = mongoose.model("post", postSchema)
module.exports = postData;