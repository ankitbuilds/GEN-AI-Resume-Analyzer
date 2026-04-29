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

// Test route for actual resume PDF generation with sample data
app.get('/api/test-actual-resume-pdf', async (req, res) => {
    try {
        const { generateResumePdf } = require("./services/ai.service")

        // Sample data that might cause issues
        const testData = {
            resume: "Software Developer with 5 years experience",
            selfDescription: "I am a developer",
            jobDescription: "Looking for developer"
        }

        console.log("Testing actual resume PDF generation with sample data...")
        const pdfBuffer = await generateResumePdf(testData)

        console.log("Test resume PDF generated successfully, size:", pdfBuffer.length)
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename="test-actual-resume.pdf"')
        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error in test actual resume PDF generation:", error)
        res.status(500).json({ error: error.message, stack: error.stack })
    }
})

// Test route for HTML validation
app.get("/api/test-html-validation", async (req, res) => {
    try {
        const { generateFallbackResumeHtml } = require("./services/ai.service")
        const testHtml = generateFallbackResumeHtml({
            resume: "Test resume content",
            selfDescription: "Test self description",
            jobDescription: "Test job description"
        })

        console.log("Generated HTML length:", testHtml.length)
        console.log("HTML preview:", testHtml.substring(0, 200))

        res.set({
            "Content-Type": "text/html",
            "Content-Disposition": "inline"
        })
        res.send(testHtml)
    } catch (error) {
        console.error("HTML validation test failed:", error.message)
        res.status(500).json({ error: error.message })
    }
})

module.exports = app