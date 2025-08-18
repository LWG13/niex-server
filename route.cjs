const userRouter = require("./userRouter.cjs")
const postRouter = require("./postRouter.cjs")

function route(app) {
 app.use("/user", userRouter)
  app.use("/post", postRouter)
}
module.exports = route