import { apiClient } from './config';

/**
 * Statistics Service
 * Handles all statistics and analytics operations
 */

/**
 * Get comprehensive dashboard statistics
 * @returns {Promise<Object>} Dashboard stats (books, users, loans)
 */
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get('/stats/dashboard');
    return response.data;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    throw error;
  }
};

/**
 * Get detailed book statistics
 * @returns {Promise<Object>} Book stats (total books, copies, most borrowed)
 */
export const getBookStats = async () => {
  try {
    const response = await apiClient.get('/stats/books');
    return response.data;
  } catch (error) {
    console.error('Get book stats error:', error);
    throw error;
  }
};

/**
 * Get most borrowed books
 * @param {number} limit - Maximum number of books to return (default 10)
 * @returns {Promise<Array>} List of most borrowed books with borrow counts
 */
export const getMostBorrowedBooks = async (limit = 10) => {
  try {
    const response = await apiClient.get('/stats/books/most-borrowed', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get most borrowed books error:', error);
    throw error;
  }
};

/**
 * Get detailed loan statistics
 * @param {number} year - Year for monthly loan stats (optional, defaults to current year)
 * @returns {Promise<Object>} Loan stats (active, overdue, pending, by month, top borrowers)
 */
export const getLoanStats = async (year = null) => {
  try {
    const params = year ? { year } : {};
    const response = await apiClient.get('/stats/loans', { params });
    return response.data;
  } catch (error) {
    console.error('Get loan stats error:', error);
    throw error;
  }
};

/**
 * Get loan count by month for a specific year
 * @param {number} year - Year (optional, defaults to current year)
 * @returns {Promise<Array>} Monthly loan counts
 */
export const getLoansByMonth = async (year = null) => {
  try {
    const params = year ? { year } : {};
    const response = await apiClient.get('/stats/loans/by-month', { params });
    return response.data;
  } catch (error) {
    console.error('Get loans by month error:', error);
    throw error;
  }
};

/**
 * Get users with most loans
 * @param {number} limit - Maximum number of users to return (default 10)
 * @returns {Promise<Array>} List of top borrowers with loan counts
 */
export const getTopBorrowers = async (limit = 10) => {
  try {
    const response = await apiClient.get('/stats/loans/top-borrowers', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get top borrowers error:', error);
    throw error;
  }
};

/**
 * Get detailed user statistics
 * @returns {Promise<Object>} User stats (total users, by role, blacklisted, with infractions)
 */
export const getUserStats = async () => {
  try {
    const response = await apiClient.get('/stats/users');
    return response.data;
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
};

/**
 * Get list of users with infractions > 0 (Admin only)
 * @returns {Promise<Array>} List of users with infractions
 */
export const getUsersWithInfractions = async () => {
  try {
    const response = await apiClient.get('/stats/users/infractions');
    return response.data;
  } catch (error) {
    console.error('Get users with infractions error:', error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getBookStats,
  getMostBorrowedBooks,
  getLoanStats,
  getLoansByMonth,
  getTopBorrowers,
  getUserStats,
  getUsersWithInfractions,
};
