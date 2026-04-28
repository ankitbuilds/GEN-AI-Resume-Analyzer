// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const apiConfig = {
    baseURL: API_BASE_URL,
    withCredentials: true
}

export default API_BASE_URL
