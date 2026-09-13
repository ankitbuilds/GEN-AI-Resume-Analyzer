const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

// async function registerUserController(req, res) {
//     const { username, email, password } = req.body

//     if (!username || !email || !password) {
//         return res.status(400).json({
//             message: "please provide username, email and password"
//         })
//     }

//     const isUserAlreadyExists = await userModel.findOne({
//         $or: [{ username }, { email }]
//     })

//     if (isUserAlreadyExists) {
//         return res.status(400).json({
//             message: "Account already exists with this email address or username"
//         })
//     }

//     const hash = await bcrypt.hash(password, 10)

//     const user = await userModel.create({
//         username,
//         email,
//         password: hash
//     })

//     const token = jwt.sign(
//         { id: user._id, username: user.username },
//         process.env.JWT_SECRET,
//         { expiresIn: "1d" }
//     )

//     // res.cookie("token", token, {
//     //     httpOnly: true,
//     //     sameSite: "none",
//     //     secure: process.env.NODE_ENV === "production",
//     //     maxAge: 24 * 60 * 60 * 1000
//     // })
//     res.cookie("token", token, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: false,
//     maxAge: 24 * 60 * 60 * 1000
// })

//     res.status(201).json({
//         message: "User registered successfully",
//         user: {
//             id: user._id,
//             username: user.username,
//             email: user.email
//         }
//     })
// }


async function registerUserController(req, res) {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "please provide username, email and password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ username }, { email }]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "Account already exists with this email address or username"
        })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await userModel.create({
        username,
        email,
        password: hash
    })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    const isProd = process.env.NODE_ENV === "production"

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 24 * 60 * 60 * 1000
    })

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

async function loginUserController(req, res) {
    const { email, password } = req.body

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(400).json({
            message: "password invalid"
        })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    // res.cookie("token", token, {
    //     httpOnly: true,
    //     sameSite: "none",
    //     secure: process.env.NODE_ENV === "production",
    //     maxAge: 24 * 60 * 60 * 1000
    // })
    const isProd = process.env.NODE_ENV === "production"

const cookieOptions = {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 24 * 60 * 60 * 1000
}

res.cookie("token", token, cookieOptions)
    res.status(200).json({
        message: "User logedIn successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email

        }
    })

}

async function logoutUserController(req, res) {
    const token = req.cookies.token
    if (token) {
        await tokenBlacklistModel.create({ token })
    }
     const isProd = process.env.NODE_ENV === "production"
    // res.clearCookie("token", {
    //     httpOnly: true,
    //     sameSite: "none",
    //     secure: process.env.NODE_ENV === "production"
    // })
   res.clearCookie("token", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd
})

    res.status(200).json({
        message: "user logged out successfully"

    })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id)

    res.status(200).json({
        message: "user detailed fetch successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController }