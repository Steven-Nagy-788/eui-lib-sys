"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api/authService"
import "../assets/LoginPage.css"

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [idOrEmail, setIdOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Login with email (or convert ID to email if needed)
      const email = idOrEmail.includes('@') ? idOrEmail : `${idOrEmail}@students.eui.edu.eg`
      
      const { user } = await login(email, password)
      
      // Map backend role to frontend role
      const mappedUser = {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role === 'admin' ? 'admin' : 'patron',
        university_id: user.university_id,
        faculty: user.faculty,
        academic_year: user.academic_year,
        infractions_count: user.infractions_count,
        is_blacklisted: user.is_blacklisted,
      }
      
      sessionStorage.setItem("user", JSON.stringify(mappedUser))
      onLogin(mappedUser)
    } catch (err) {
      console.error('Login failed:', err)
      setError(err.message || "Invalid email or password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="loginPage">
      {/* Left side - Library image with logo overlay */}
      <div className="loginImageSection">
        <div className="logoOverlay">
          <img src="/university-logo.png" alt="Egypt University of Informatics" className="universityLogo" />
        </div>
        <img
          src="/images/library_.png"
          alt="Library Interior"
          className="libraryBackgroundImage"
        />
      </div>

      {/* Right side - Login form */}
      <div className="loginFormSection">
        <div className="loginContainer">
          <div className="loginHeader">
            <h1>Egypt University of Informatics Library</h1>
          </div>

          <form onSubmit={handleSubmit} className="loginForm">
            <div className="formGroup">
              <label htmlFor="idOrEmail">ID Number / Email</label>
              <input
                id="idOrEmail"
                type="text"
                placeholder="Enter your ID or email"
                value={idOrEmail}
                onChange={(e) => setIdOrEmail(e.target.value)}
                required
                className="formInput"
              />
            </div>

            <div className="formGroup">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="formInput"
              />
            </div>

            {error && <div className="errorMessage">{error}</div>}

            <button type="submit" className="submitButton" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <button type="button" className="forgotPasswordLink">
              Forgot Password?
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
