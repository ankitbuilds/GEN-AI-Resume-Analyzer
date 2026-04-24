const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
    matchScore: z.number().describe("Match score 0-100"),

    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),

    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),

    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"]),
    })),

    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    }))
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    try {
        const prompt = `Generate interview preparation strategy as JSON with no markdown.
        
Resume: ${resume || "No resume"}
Self Description: ${selfDescription || "No description"}
Job Description: ${jobDescription}

Return only valid JSON with: matchScore (0-100), technicalQuestions (5+ with question/intention/answer), behavioralQuestions (5+ with question/intention/answer), skillGaps (array with skill/severity), preparationPlan (5+ days with day/focus/tasks array)`

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema)
            }
        })
        
        return JSON.parse(response.text)
    } catch (error) {
        console.error("generateInterviewReport error:", error.message, error.response?.text)
        
        // Handle specific Google AI API errors
        if (error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED")) {
            console.log("AI quota exceeded, using mock data for testing")
            // Return mock data for testing when quota is exceeded
            return {
                matchScore: 75,
                technicalQuestions: [
                    {
                        question: "Can you explain the difference between var, let, and const in JavaScript?",
                        intention: "Assess understanding of JavaScript variable declarations and scoping",
                        answer: "Var is function-scoped and can be redeclared, let is block-scoped and can be reassigned but not redeclared, const is block-scoped and cannot be reassigned or redeclared."
                    },
                    {
                        question: "How does React's virtual DOM work?",
                        intention: "Test knowledge of React's core performance optimization",
                        answer: "React creates a virtual representation of the DOM in memory. When state changes, React compares the virtual DOM with the real DOM and only updates the differences, making updates more efficient."
                    },
                    {
                        question: "Explain how Node.js handles asynchronous operations",
                        intention: "Check understanding of Node.js event-driven architecture",
                        answer: "Node.js uses an event loop and callback system. Asynchronous operations are handled through callbacks, promises, or async/await. The event loop processes I/O operations without blocking the main thread."
                    },
                    {
                        question: "What are the differences between SQL and NoSQL databases?",
                        intention: "Assess database knowledge and ability to choose appropriate technology",
                        answer: "SQL databases are relational with fixed schemas, ACID compliance, and complex queries. NoSQL databases are schema-less, horizontally scalable, and better for unstructured data and high-volume reads/writes."
                    },
                    {
                        question: "How would you optimize a slow React application?",
                        intention: "Test performance optimization skills",
                        answer: "Use React.memo, useMemo, useCallback for memoization, implement code splitting, optimize images, use lazy loading, avoid unnecessary re-renders, and use React DevTools Profiler to identify bottlenecks."
                    }
                ],
                behavioralQuestions: [
                    {
                        question: "Tell me about a challenging project you worked on and how you overcame the difficulties.",
                        intention: "Assess problem-solving skills and resilience",
                        answer: "Choose a specific project, describe the challenge clearly, explain the steps you took to solve it, and highlight what you learned from the experience."
                    },
                    {
                        question: "How do you handle tight deadlines and competing priorities?",
                        intention: "Test time management and prioritization skills",
                        answer: "Prioritize tasks based on urgency and importance, communicate with stakeholders about realistic timelines, break down large tasks into smaller manageable pieces, and focus on high-impact work first."
                    },
                    {
                        question: "Describe a time when you received constructive criticism. How did you respond?",
                        intention: "Assess ability to receive feedback and grow",
                        answer: "Acknowledge the feedback positively, ask clarifying questions if needed, reflect on how to implement the suggestions, and follow up to show improvement."
                    },
                    {
                        question: "How do you stay updated with the latest technologies and industry trends?",
                        intention: "Check commitment to continuous learning",
                        answer: "Follow tech blogs, participate in online communities, attend conferences/webinars, contribute to open source, take online courses, and experiment with new technologies in personal projects."
                    },
                    {
                        question: "Tell me about a time you had to work with a difficult team member. How did you handle it?",
                        intention: "Test interpersonal and conflict resolution skills",
                        answer: "Focus on the work and maintain professionalism, try to understand their perspective, communicate clearly and respectfully, involve a mediator if necessary, and learn from the experience."
                    }
                ],
                skillGaps: [
                    { skill: "Advanced cloud deployment (AWS/Azure)", severity: "medium" },
                    { skill: "Container orchestration (Docker/Kubernetes)", severity: "high" },
                    { skill: "Advanced testing frameworks (Jest/Cypress)", severity: "low" },
                    { skill: "Microservices architecture", severity: "medium" }
                ],
                preparationPlan: [
                    {
                        day: 1,
                        focus: "Technical Fundamentals Review",
                        tasks: ["Review JavaScript ES6+ features", "Practice React component patterns", "Study Node.js asynchronous programming"]
                    },
                    {
                        day: 2,
                        focus: "Database and Backend Concepts",
                        tasks: ["Review SQL vs NoSQL differences", "Practice MongoDB queries", "Study REST API design patterns"]
                    },
                    {
                        day: 3,
                        focus: "System Design and Architecture",
                        tasks: ["Study scalable system design principles", "Practice designing APIs", "Review common design patterns"]
                    },
                    {
                        day: 4,
                        focus: "Behavioral Interview Preparation",
                        tasks: ["Prepare STAR method responses", "Practice common behavioral questions", "Research company culture and values"]
                    },
                    {
                        day: 5,
                        focus: "Mock Interviews and Final Review",
                        tasks: ["Conduct mock technical interviews", "Review and refine answers", "Prepare questions for interviewers"]
                    }
                ]
            }
        }
        
        throw error
    }
}

async function generateResumePdf({resume, selfDescription, jobDescription}){
    try {
        const resumePdfSchema = z.object({
            html: z.string()
        })

        const prompt = `Generate tailored resume HTML only, valid JSON with "html" field.
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config:{
                responseMimeType:"application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)
        return await generatePdfFromHtml(jsonContent.html)
    } catch (error) {
        console.error("generateResumePdf error:", error.message)
        throw error
    }
}

async function generatePdfFromHtml(htmlContent){
    try {
        const browser = await puppeteer.launch()
        const page = await browser.newPage();
        await page.setContent(htmlContent, {waitUntil: "networkidle0"})

        const pdfBuffer = await page.pdf({format: "A4"})

        await browser.close()
        return pdfBuffer
    } catch (error) {
        console.error("generatePdfFromHtml error:", error.message)
        throw error
    }
}

module.exports = {generateInterviewReport, generateResumePdf}