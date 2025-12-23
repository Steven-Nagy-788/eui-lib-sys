/**
 * Authentication Service - API calls only
 * Handles login, logout, and user profile operations
 */

import { apiClient } from './config'
import { saveToken, removeToken, decodeToken } from '../utils/auth'

/**
 * Login user
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/users/login', { email, password })
    const { access_token } = response.data
    
    // Validate token
    const payload = decodeToken(access_token)
    if (!payload?.id || !payload?.role) {
      throw new Error('Invalid token: missing user ID or role')
    }
    
    saveToken(access_token)
    
    return {
      token: access_token,
      user: { id: payload.id, role: payload.role }
    }
  } catch (error) {
    removeToken()
    throw error
  }
}

/**
 * Logout user
 */
export const logout = () => {
  removeToken()
}

/**
 * Get current user profile from API (uses /users/me endpoint)
 */
export const getCurrentUserProfile = async () => {
  const response = await apiClient.get('/users/me')
  return response.data
}

/**
 * Get user profile by ID from API
 */
export const getUserProfile = async (userId) => {
  if (!userId) {
    return getCurrentUserProfile()
  }
  const response = await apiClient.get(`/users/${userId}`)
  return response.data
}

/**
 * Get current user dashboard with profile and loan statistics
 * Uses optimized /users/me/dashboard endpoint
 * @returns {Promise<Object>} User profile and stats
 */
export const getUserDashboard = async () => {
  try {
    const response = await apiClient.get('/users/me/dashboard');
    return response.data;
  } catch (error) {
    console.error('Get user dashboard error:', error);
    throw error;
  }
};

// Re-export auth utilities for convenience
export { getUserFromToken, isAuthenticated, getToken } from '../utils/auth'
