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
 * @returns {Promise<{user: Object, token: string}>} User data and auth token
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/users/login', {
      email,
      password,
    });
    
    const { access_token, token_type } = response.data;
    
    // Store token first so it's available for subsequent requests
    localStorage.setItem('auth_token', access_token);
    
    // Decode token to get user_id
    const payload = decodeJWT(access_token);
    if (!payload || !payload.id) {
      throw new Error('Invalid token: missing user ID');
    }
    
    // Fetch user profile using the user_id from token
    const userId = payload.id;
    const userResponse = await getUserProfile(userId);
    localStorage.setItem('user', JSON.stringify(userResponse));
    
    return {
      user: userResponse,
      token: access_token,
    };
  } catch (error) {
    console.error('Login error:', error);
    // Clean up on error
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    throw error;
  }
};

/**
 * Get user profile by user ID
 * @param {number} userId - User ID (optional, will use stored user if not provided)
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId = null) => {
  try {
    // If no userId provided, try to get from stored user or token
    if (!userId) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userId = user.id;
      } else {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const payload = decodeJWT(token);
          userId = payload?.id;
        }
      }
    }
    
    if (!userId) {
      throw new Error('No user ID available');
    }
    
    // Fetch user from API
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
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
 * @returns {Object|null} User data or null
 */
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default {
  login,
  logout,
  getUserProfile,
  isAuthenticated,
  getToken,
  getCurrentUser,
};
