const pdfParse = require('pdf-parse')
const {generateInterviewReport, generateResumePdf} = require("../services/ai.service")
const interviewReportModel = require("../models/interviewreport.model")


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
            user: req.user.id,
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
        const interviewReports = await interviewReportModel.find({user:req.user.id}).sort({created:-1}).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
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

        const interviewReport = await interviewReportModel.findOne({_id: interviewReportId, user: req.user.id})

        if(!interviewReport){
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        const {resume, jobDescription, selfDescription} = interviewReport

        let pdfBuffer;
        try {
            pdfBuffer = await generateResumePdf({resume, selfDescription, jobDescription})
        } catch (pdfError) {
            console.error("PDF generation failed, returning text fallback:", pdfError.message)
            // Fallback: Return text content as downloadable file
            const textContent = `Resume for Interview Report ${interviewReportId}\n\nJob Description:\n${jobDescription}\n\nSelf Description:\n${selfDescription}\n\nResume Content:\n${resume || 'No resume uploaded'}`
            pdfBuffer = Buffer.from(textContent, 'utf-8')
            
            res.set({
                "Content-Type": "text/plain",
                "Content-Disposition": `attachment; filename=resume_${interviewReportId}.txt`
            })
            return res.send(pdfBuffer)
        }

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