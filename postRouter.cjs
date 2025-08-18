const express = require("express")
const postModel = require("./postModel.cjs")
const postRouter = express.Router()
const commentModel = require("./commentModel.cjs")
const { ObjectId } = require('mongodb')

postRouter.get('/latest', async (req, res) => {
  try {
    const latestPost = await postModel.findOne().sort({ createdAt: -1 });
    res.json(latestPost);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

postRouter.get('/next-three', async (req, res) => {
  try {
    const latestPost = await postModel.findOne().sort({ createdAt: -1 });

    const nextPosts = await postModel.find({ _id: { $ne: latestPost._id } })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json(nextPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

postRouter.get('/normal', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skipCount = 4 + (page - 1) * limit;

  
     const totalPosts = await postModel.countDocuments();
   console.log(totalPosts)
    
    if (skipCount >= totalPosts) {
      return res.json([]);
    }

    const normalPosts = await postModel.find()
      .skip(skipCount)
      .limit(limit);

    res.json(normalPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});
postRouter.get('/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skipCount = (page - 1) * limit;


    const totalPosts = await postModel.countDocuments();


    if (skipCount >= totalPosts) {
      return res.json([]);
    }

    const normalPosts = await postModel.find()
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(limit);

    res.json(normalPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

postRouter.get("/:_id", async (req, res) => {
  try{
    const post = await postModel.findById(req.params._id)
    res.json(post)
  } catch(err) {
    console.log(err)
  }
})

postRouter.post("/comment", async (req, res) => {
  const { userId, username, userImage, content, postId} = req.body
  
  const comment = new commentModel({
    userId: userId,
    username: username,
    userImage: userImage,
    content: content,
    postId: postId
  })
  await comment.save()
    res.status(200).send({success: "success"})
})

postRouter.get("/comment/:postId", async (req, res) => {
  try{
    const page = parseInt(req.query.page)
    const id = new ObjectId(req.params.postId)
    const comment = await commentModel.find({postId: id}).sort({createdAt: -1}).skip((page - 1) * 5).limit(5)
    res.json(comment)

  } catch(err){
    console.log(err)
  }
})
postRouter.get("/comment/user/:userId", async (req, res) => {
  try{
    const page = parseInt(req.query.page) 
    const id = new ObjectId(req.params.userId)
    const comment = await commentModel.find({userId: id}).sort({createdAt: -1}).skip((page - 1) * 10).limit(10)
    res.json(comment)

  } catch(err){
    console.log(err)
  }
})
postRouter.get("/comment/user/number/:userId", async (req, res) => {
  try{
    const id = new ObjectId(req.params.userId)
    const comment = await commentModel.find({userId: id})
    res.json(comment)

  } catch(err){
    console.log(err)
  }
})

postRouter.get('/latest/:category', async (req, res) => {
  try {
    const category = req.params.category
    const latestPost = await postModel.findOne({category: category}).sort({ createdAt: -1 });
    res.json(latestPost);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

postRouter.get('/next-three/:category', async (req, res) => {
  try {
    const latestPost = await postModel.findOne().sort({ createdAt: -1 });

    const nextPosts = await postModel.find({ _id: { $ne: latestPost._id }, category: req.params.category })
      .sort({ createdAt: -1 })
      .limit(3);

    res.json(nextPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

postRouter.get('/normal/:category', async (req, res) => {
  try {
    const category = req.params.category
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skipCount = 4 + (page - 1) * limit;


    const totalPosts = await postModel.countDocuments();


    if (skipCount >= totalPosts) {
      return res.json([]);
    }

    const normalPosts = await postModel.find({category: category})
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(limit);

    res.json(normalPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});
postRouter.get('/news/:category', async (req, res) => {
  try {
    const limit = 5;
    const category = req.params.category
    const normalPosts = await postModel.find({category: req.params.category})
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(normalPosts);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});
postRouter.post("/search", async (req, res) => {
  try {
        const { search } = req.body;
        if (!search) return res.status(400).json({ message: "Thiếu từ khóa tìm kiếm" });

       
        const posts = await postModel.find({
            title: { $regex: search, $options: "i" }  
        });

        
    res.status(200).json({post: posts, success: true});
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
  }
});
module.exports = postRouter
