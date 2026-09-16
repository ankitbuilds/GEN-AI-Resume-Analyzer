import axios from 'axios'
import API_BASE_URL from '../../../config/api.js'

export async function register({ username, email, password }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            username, email, password
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }
}

export async function login({ email, password }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email, password
        })
        if (response.data.token) {
            localStorage.setItem("token", response.data.token)
        }
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }
}

export async function logout() {
    try {
        const token = localStorage.getItem("token")
        const response = await axios.get(`${API_BASE_URL}/api/auth/logout`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    } finally {
        localStorage.removeItem("token")
    }
}

export async function getMe() {
    const token = localStorage.getItem("token")
    const response = await axios.get(`${API_BASE_URL}/api/auth/get-me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    return response.data
}