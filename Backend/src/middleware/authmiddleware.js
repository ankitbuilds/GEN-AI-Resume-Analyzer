const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require('../models/blacklist.model.js')


async function authUser(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided"
        })
    }

    try {
        const isTokenBlacklisted = await tokenBlacklistModel.findOne({
            token
        })
        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "token is invalid"
            })
        }
    } catch (error) {
        console.error("Error checking token blacklist:", error)
        return res.status(500).json({
            message: "Internal server error"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    }
    catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        })

    }
}

module.exports = { authUser }