/**
 * Token Management & Authentication Utilities
 * Handles token storage, decoding, and validation
 */

const TOKEN_KEY = 'auth_token'

/**
 * Decode JWT token payload
 */
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

/**
 * Save token to localStorage
 */
export const saveToken = (token) => {
  if (!token) throw new Error('Token is required')
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Get token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Remove token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Logout user (alias for removeToken for clarity)
 */
export const logout = () => {
  removeToken()
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken()
  if (!token) return false
  
  const payload = decodeToken(token)
  if (!payload || !payload.id || !payload.role) return false
  
  // Check expiration
  if (payload.exp && payload.exp < Date.now() / 1000) {
    removeToken()
    return false
  }
  
  return true
}

/**
 * Get user data from stored token
 */
export const getUserFromToken = () => {
  const token = getToken()
  if (!token) return null

  const payload = decodeToken(token)
  if (!payload || !payload.id || !payload.role) {
    removeToken()
    return null
  }

  return {
    id: payload.id,
    role: payload.role
  }
}

/**
 * Get redirect path based on user role
 */
export const getRedirectPath = (role) => {
  return role === 'admin' ? '/admin/books' : '/patron/books'
}

/**
 * Check if role is patron (student or professor)
 */
export const isPatronRole = (role) => {
  return role === 'student' || role === 'professor'
}
