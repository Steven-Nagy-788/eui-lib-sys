import { apiClient } from './config';

/**
 * Users Service
 * Handles all user management operations
 */

/**
 * Get all users with pagination
 * @param {number} skip - Number of users to skip
 * @param {number} limit - Maximum number of users to return
 * @returns {Promise<Array>} List of users
 */
export const getUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get('/users/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
};

/**
 * Get a specific user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User details
 */
export const getUser = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

/**
 * Search users by name, email, or university ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get('/users/search/', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Search users error:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData - User creation data
 * @returns {Promise<Object>} Created user
 */
export const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update a user
 * @param {number} userId - User ID
 * @param {Object} userData - User update data
 * @returns {Promise<Object>} Updated user
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await apiClient.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete a user (Admin only)
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (userId) => {
  try {
    await apiClient.delete(`/users/${userId}`);
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

/**
 * Clear user's infractions count (Admin only)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
export const clearInfractions = async (userId) => {
  try {
    const response = await apiClient.post(`/users/${userId}/clear-infractions`);
    return response.data;
  } catch (error) {
    console.error('Clear infractions error:', error);
    throw error;
  }
};

/**
 * Add user to blacklist (Admin only)
 * @param {number} userId - User ID
 * @param {string} reason - Blacklist reason
 * @returns {Promise<Object>} Updated user
 */
export const addToBlacklist = async (userId, reason) => {
  try {
    const response = await apiClient.post(`/users/${userId}/blacklist`, null, {
      params: { reason }
    });
    return response.data;
  } catch (error) {
    console.error('Add to blacklist error:', error);
    throw error;
  }
};

/**
 * Remove user from blacklist (Admin only)
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
export const removeFromBlacklist = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}/blacklist`);
    return response.data;
  } catch (error) {
    console.error('Remove from blacklist error:', error);
    throw error;
  }
};

export default {
  getUsers,
  getUser,
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
  clearInfractions,
  addToBlacklist,
  removeFromBlacklist,
};
