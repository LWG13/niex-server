const dotenv = require("dotenv")
dotenv.config();
const helmet = require("helmet")
const express = require('express')
const rateLimit = require("express-rate-limit")
const app = express();
const route = require("./route.cjs")
const connect = require("./connect.cjs");
const cors = require("cors");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // tối đa 100 request / IP
});
app.use(limiter);
app.use(cors());
connect();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet())
route(app)
app.listen(3000, () => {
  console.log('Express server initialized');
}); 