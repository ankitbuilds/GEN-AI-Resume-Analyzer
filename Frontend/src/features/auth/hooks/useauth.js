import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";


export const useAuth = () => {
    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return data
        } catch (err) {
            console.error("Login error:", err)
            throw err
        }
        finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            return data
        } catch (err) {
            console.error("Registration error:", err)
            throw err
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error("Logout error:", err)
            setUser(null) // clear client state even if the server call fails
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const getAndSetUser = async () => {
            setLoading(true)
            const token = localStorage.getItem("token")

            // No token stored at all — skip the request entirely, no need to hit the API
            if (!token) {
                setUser(null)
                setLoading(false)
                return
            }

            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                console.error("Get user error:", err)
                setUser(null)
                localStorage.removeItem("token") // stale/invalid token, clear it
            }
            finally {
                setLoading(false)
            }
        }
        getAndSetUser()
    }, [])

    return {
        user,
        loading,
        handleLogin,
        handleRegister,
        handleLogout
    }
}