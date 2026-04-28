// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL

if (!API_BASE_URL) {
    console.warn(
        "VITE_API_URL is not set. The frontend will fall back to localhost and will not connect to the deployed backend."
    )
}

export const apiConfig = {
    baseURL: API_BASE_URL || 'http://localhost:3000',
    withCredentials: true
}

export default API_BASE_URL || 'http://localhost:3000'
