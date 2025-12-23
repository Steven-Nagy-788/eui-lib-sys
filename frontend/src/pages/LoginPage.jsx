import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { login } from "../api/authService"
import { getUserFromToken, getRedirectPath } from "../utils/auth"
import "../assets/LoginPage.css"

function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [idOrEmail, setIdOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Check for existing valid token on component mount
  useEffect(() => {
    const user = getUserFromToken()
    if (user) {
      onLogin()
      navigate(getRedirectPath(user.role), { replace: true })
    }
  }, [navigate, onLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const email = idOrEmail.includes('@') ? idOrEmail : `${idOrEmail}@students.eui.edu.eg`
      const { user } = await login(email, password)
      
      onLogin()
      navigate(getRedirectPath(user.role), { replace: true })
    } catch (err) {
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
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
