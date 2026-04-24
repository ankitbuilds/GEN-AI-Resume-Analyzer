const pdfParse = require('pdf-parse')
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


async function generateInterviewReportController(req, res) {
    try {
        const resumeFile = req.file
        const { selfDescription, jobDescription } = req.body
        
        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required"
            })
        }

        let resumeContent = ""
        if (resumeFile) {
            const textData = await (new pdfParse.PDFParse(Uint8Array.from(resumeFile.buffer))).getText()
            resumeContent = textData.text
        } else if (!selfDescription) {
            return res.status(400).json({
                message: "Either resume file or self-description is required"
            })
        }

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user?.id || null, // Allow null for testing
            resume: resumeContent,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated sucessfully",
            interviewReport
        })
    } catch (error) {
        console.error("Error generating interview report:", error)
        res.status(500).json({
            message: "Error generating interview report",
            error: error.message
        })
    }

}


// controller to get interview report by interviewId
async function getInterviewReportByIdController(req,res){
    try {
        const {interviewId} = req.params
        const interviewReport = await interviewReportModel.findOne({_id: interviewId, user: req.user.id})
        if(!interviewReport){
            return res.status(404).json({
                message: "Interview report not found"
            })
        }
        res.status(200).json({
            message:"Interview report fetched successfully",
            interviewReport
        })
    } catch (error) {
        console.error("Error fetching interview report:", error)
        res.status(500).json({
            message: "Error fetching interview report",
            error: error.message
        })
    }
}


// controller to get all interview reports to logged in user
async function getAllInterviewReportsController(req,res){
    try {
        const interviewReports = (await interviewReportModel.find({user:req.user.id})).toSorted({created:-1}).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        })
    } catch (error) {
        console.error("Error fetching interview reports:", error)
        res.status(500).json({
            message: "Error fetching interview reports",
            error: error.message
        })
    }

}

async function generateResumePdfController(req,res){
    try {
        const {interviewReportId} = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if(!interviewReport){
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        const {resume, jobDescription, selfDescription} = interviewReport

        const pdfBuffer = await generateResumePdf({resume, jobDescription, selfDescription})

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Error generating resume PDF:", error)
        res.status(500).json({
            message: "Error generating resume PDF",
            error: error.message
        })
    }
}

module.exports = { generateInterviewReportController,generateResumePdfController,getAllInterviewReportsController, getInterviewReportByIdController}