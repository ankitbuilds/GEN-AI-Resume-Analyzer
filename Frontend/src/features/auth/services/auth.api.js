import axios from 'axios'
import API_BASE_URL from '../../../config/api.js'


export async function register({ username, email, password }) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
            username, email, password
        }, {
            withCredentials: true
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
        }, {
            withCredentials: true
        })
        return response.data;

    } catch (err) {
        console.log(err);
        throw err
    }

}

export async function logout() {
    try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/logout`, {
            withCredentials: true
        })
        return response.data;

    } catch (err) {
        console.log(err)
        throw err
    }
}

// auth.api.js
export async function getMe() {
    const response = await axios.get(`${API_BASE_URL}/api/auth/get-me`, {
        withCredentials: true
    })
    return response.data;
}
