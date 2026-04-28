const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())

// CORS configuration for both development and production
const allowedOrigins = [
    "http://localhost:5173",           // Local development
    process.env.FRONTEND_URL,          // Render or other deployment URL
    "https://gen-ai-resume-analyzer.onrender.com" // Default Render domain (replace with your actual domain)
].filter(origin => origin) // Remove undefined entries

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}))

// /require all the routes here
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

// using all the routes here
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

module.exports = app