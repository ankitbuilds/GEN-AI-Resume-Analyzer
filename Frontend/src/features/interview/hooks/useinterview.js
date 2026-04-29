import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
        } catch (error) {
            console.error("Failed to generate interview report:", error)
            throw error // Re-throw so the component can handle it
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
            setReport(null)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport || null
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
            setReports([])
        } finally {
            setLoading(false)
        }

        return response?.interviewReports || []
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            console.log("Starting resume download for ID:", interviewReportId)
            const response = await generateResumePdf({ interviewReportId })
            console.log("Response received:", {
                status: response.status,
                headers: response.headers,
                dataType: typeof response.data,
                dataSize: response.data ? response.data.size || response.data.length : 'no data',
                isBlob: response.data instanceof Blob
            })

            // Check for error responses
            if (response.status !== 200) {
                console.error("Server returned error status:", response.status)
                let errorText = "Unknown error"
                try {
                    if (response.data instanceof Blob) {
                        errorText = await response.data.text()
                    } else {
                        errorText = JSON.stringify(response.data)
                    }
                } catch (e) {
                    errorText = "Could not read error response"
                }
                console.error("Error response:", errorText)
                throw new Error(`Server error: ${response.status} - ${errorText}`)
            }
            
            // Try to determine content type from response
            let mimeType = 'application/pdf'
            let fileExtension = 'pdf'
            
            // Check if response has content-type header
            if (response.headers && response.headers['content-type']) {
                const contentType = response.headers['content-type']
                console.log("Content-Type header:", contentType)
                if (contentType.includes('text/plain')) {
                    mimeType = 'text/plain'
                    fileExtension = 'txt'
                } else if (contentType.includes('text/html')) {
                    mimeType = 'text/html'
                    fileExtension = 'html'
                } else if (!contentType.includes('application/pdf')) {
                    console.warn("Unexpected content type:", contentType)
                }
            }
            
            console.log("Creating blob with mimeType:", mimeType)
            // If response.data is already a Blob, use it directly
            let blobData = response.data
            if (!(response.data instanceof Blob)) {
                console.log("Response data is not a Blob, creating new Blob")
                blobData = new Blob([response.data], { type: mimeType })
            }

            console.log("Blob size:", blobData.size, "type:", blobData.type)

            if (blobData.size === 0) {
                throw new Error("Downloaded file is empty")
            }

            // Check if blob is valid by reading first few bytes
            const arrayBuffer = await blobData.arrayBuffer()
            const uint8Array = new Uint8Array(arrayBuffer.slice(0, 5))
            const header = String.fromCharCode(...uint8Array)
            console.log("Blob header:", header)

            if (mimeType === 'application/pdf' && !header.startsWith('%PDF')) {
                console.error("Blob does not contain valid PDF data")
                // Try to show the content as text for debugging
                const textContent = new TextDecoder().decode(arrayBuffer.slice(0, 200))
                console.error("First 200 bytes as text:", textContent)

                // If it's HTML content, show it
                if (textContent.includes('<html') || textContent.includes('<!DOCTYPE')) {
                    console.log("Received HTML instead of PDF, opening in new tab for inspection")
                    const htmlUrl = window.URL.createObjectURL(new Blob([arrayBuffer], { type: 'text/html' }))
                    window.open(htmlUrl, '_blank')
                    // Show alert to user
                    alert("Received HTML instead of PDF. Check the new tab for the content. This indicates a PDF generation issue.")
                    return
                }

                throw new Error("Downloaded file is not a valid PDF")
            }

            const url = window.URL.createObjectURL(blobData)
            console.log("Blob URL created:", url)

            // Verify the blob is valid
            try {
                const testResponse = await fetch(url)
                console.log("Blob fetch test - ok:", testResponse.ok, "content-type:", testResponse.headers.get('content-type'))
            } catch (fetchError) {
                console.error("Blob fetch test failed:", fetchError)
            }
            
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.${fileExtension}`)
            link.setAttribute("target", "_blank")
            link.style.display = "none"
            document.body.appendChild(link)

            // Add event listeners to track download
            link.addEventListener('click', () => {
                console.log("Download link clicked")
            })

            // Try a different approach - open in new tab first to verify content
            console.log("Opening PDF in new tab for verification...")
            const newTab = window.open(url, '_blank')

            if (!newTab) {
                console.warn("Popup blocked, trying direct download")
                link.click()
            } else {
                console.log("PDF opened in new tab, now triggering download")
                // Close the tab after a delay
                setTimeout(() => {
                    if (!newTab.closed) {
                        newTab.close()
                    }
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    console.log("Download initiated and cleanup done")
                }, 2000)
            }

            // Show success message
            console.log("Resume download process completed")
            // Optional: Show success message to user
            // alert("Resume downloaded successfully!")
        }
        catch (error) {
            console.error("Error downloading resume:", error)
            // Show user-friendly error message
            const errorMessage = error.message || "Failed to download resume"
            alert(`Error: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}