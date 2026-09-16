const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const multer = require("multer")

const app = express()

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL,
    "https://gen-ai-resume-analyzer.onrender.com",
    "https://gen-ai-resume-analyzer-g7u0.onrender.com"
].filter(Boolean)

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true
}))

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// Global error handler — must be last
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err)

    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Resume file is too large. Max size is 5MB." })
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` })
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({ message: "CORS: origin not allowed" })
    }

    res.status(500).json({ message: "Internal server error", error: err.message })
})

module.exports = app