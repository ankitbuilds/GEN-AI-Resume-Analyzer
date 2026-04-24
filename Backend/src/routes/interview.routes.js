const express = require("express")
const authMiddleware = require("../middleware/authmiddleware")
const interviewController = require('../controllers/interview.controller')
const upload = require("../middleware/file.middleware")

const interviewRouter = express.Router()


interviewRouter.post("/", upload.single("resume"), interviewController.generateInterviewReportController)
interviewRouter.get("/report/:interviewId", interviewController.getInterviewReportByIdController)
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

module.exports = interviewRouter