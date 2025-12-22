import { apiClient } from './config';

/**
 * Authentication Service
 * Handles user login, logout, and token management
 */

/**
 * Decode JWT token to get payload
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string}>} Auth token
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/users/login', {
      email,
      password,
    });
    
    const { access_token } = response.data;
    
    // Only store token - no user data in localStorage for security
    localStorage.setItem('auth_token', access_token);
    
    // Verify token is valid
    const payload = decodeJWT(access_token);
    if (!payload || !payload.id) {
      throw new Error('Invalid token: missing user ID');
    }
    
    return {
      token: access_token,
    };
  } catch (error) {
    console.error('Login error:', error);
    localStorage.removeItem('auth_token');
    throw error;
  }
};

/**
 * Get user data from JWT token
 * @returns {Object|null} User data from token or null if not authenticated
 */
export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  return {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    university_id: payload.uniId,
  };
};

/**
 * Get user profile by user ID from API
 * @param {string} userId - User ID (optional, will use token user if not provided)
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId = null) => {
  try {
    // If no userId provided, get from token
    if (!userId) {
      const tokenUser = getUserFromToken();
      if (!tokenUser) {
        throw new Error('Not authenticated');
      }
      userId = tokenUser.id;
    }
    
    // Fetch user from API
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
  }
};

/**
 * Logout current user
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

/**
 * Get stored auth token
 * @returns {string|null} Auth token or null
 */
export const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Get stored user data
 * @retcurrent user data from token
 * @returns {Object|null} User data or null
 */
export const getCurrentUser = () => {
  return getUserFromToken();
};

export default {
  login,
  logout,
  getUserProfile,
  isAuthenticated,
  getToken,
  getCurrentUser,
};
