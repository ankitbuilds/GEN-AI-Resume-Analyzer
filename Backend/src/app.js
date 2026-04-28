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

// Test route for Puppeteer
app.get("/api/test-pdf", async (req, res) => {
    try {
        const puppeteer = require("puppeteer")
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        })
        const page = await browser.newPage()
        await page.setContent("<h1>Test PDF</h1><p>This is a test.</p>")
        const pdfBuffer = await page.pdf({ format: "A4" })
        await browser.close()

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=test.pdf"
        })
        res.send(pdfBuffer)
    } catch (error) {
        console.error("Puppeteer test failed:", error.message)
        res.status(500).json({ error: error.message })
    }
})

module.exports = app