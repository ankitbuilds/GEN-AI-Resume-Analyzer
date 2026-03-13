const { Router } = require('express')
const authController = require('../controllers/auth.controller.js')
const authMiddleware = require('../middleware/authmiddleware.js')


const authRouter = Router()

authRouter.post("/register", authController.registerUserController)
authRouter.post("/login", authController.loginUserController)
authRouter.get("/logout", authController.logoutUserController)
authRouter.get("/get-me", authMiddleware.authUser, authController.getMeController)
module.exports = authRouter