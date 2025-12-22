import { apiClient } from './config';

/**
 * Loans Service
 * Handles all loan/circulation operations
 */

/**
 * Get all loans with pagination
 * @param {number} skip - Number of loans to skip
 * @param {number} limit - Maximum number of loans to return
 * @returns {Promise<Array>} List of loans
 */
export const getAllLoans = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get('/loans/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get all loans error:', error);
    throw error;
  }
};

/**
 * Get loans by status
 * @param {string} status - Loan status (pending, active, returned, overdue, rejected)
 * @param {number} skip - Number of loans to skip
 * @param {number} limit - Maximum number of loans to return
 * @returns {Promise<Array>} List of loans
 */
export const getLoansByStatus = async (status, skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get(`/loans/status/${status}`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get loans by status error:', error);
    throw error;
  }
};

/**
 * Get all loans for a specific user
 * @param {number} userId - User ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} List of user's loans
 */
export const getUserLoans = async (userId, status = null) => {
  try {
    const params = status ? { status } : {};
    const response = await apiClient.get(`/loans/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Get user loans error:', error);
    throw error;
  }
};

/**
 * Get all overdue loans
 * @returns {Promise<Array>} List of overdue loans
 */
export const getOverdueLoans = async () => {
  try {
    const response = await apiClient.get('/loans/overdue');
    return response.data;
  } catch (error) {
    console.error('Get overdue loans error:', error);
    throw error;
  }
};

/**
 * Get a specific loan by ID
 * @param {number} loanId - Loan ID
 * @returns {Promise<Object>} Loan details
 */
export const getLoan = async (loanId) => {
  try {
    const response = await apiClient.get(`/loans/${loanId}`);
    return response.data;
  } catch (error) {
    console.error('Get loan error:', error);
    throw error;
  }
};

/**
 * Search loans with multiple filters
 * @param {Object} filters - Search filters (user_id, status, date_from, date_to)
 * @returns {Promise<Array>} List of matching loans
 */
export const searchLoans = async (filters) => {
  try {
    const response = await apiClient.get('/loans/search/', {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('Search loans error:', error);
    throw error;
  }
};

/**
 * Create a loan request
 * @param {number} copyId - Book copy ID
 * @returns {Promise<Object>} Created loan with pending status
 */
export const createLoanRequest = async (copyId) => {
  try {
    const response = await apiClient.post('/loans/request', null, {
      params: { copy_id: copyId }
    });
    return response.data;
  } catch (error) {
    console.error('Create loan request error:', error);
    throw error;
  }
};

/**
 * Approve a loan request (Admin only)
 * @param {number} loanId - Loan ID
 * @returns {Promise<Object>} Updated loan with active status
 */
export const approveLoan = async (loanId) => {
  try {
    const response = await apiClient.post(`/loans/${loanId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approve loan error:', error);
    throw error;
  }
};

/**
 * Reject a loan request (Admin only)
 * @param {number} loanId - Loan ID
 * @returns {Promise<Object>} Updated loan with rejected status
 */
export const rejectLoan = async (loanId) => {
  try {
    const response = await apiClient.post(`/loans/${loanId}/reject`);
    return response.data;
  } catch (error) {
    console.error('Reject loan error:', error);
    throw error;
  }
};

/**
 * Process a book return (Admin only)
 * @param {number} loanId - Loan ID
 * @param {boolean} incrementInfractions - Whether to increment user infractions if overdue
 * @returns {Promise<Object>} Updated loan with returned status
 */
export const returnLoan = async (loanId, incrementInfractions = true) => {
  try {
    const response = await apiClient.post(`/loans/${loanId}/return`, null, {
      params: { increment_infractions: incrementInfractions }
    });
    return response.data;
  } catch (error) {
    console.error('Return loan error:', error);
    throw error;
  }
};

/**
 * Update a loan (Admin only - for manual adjustments)
 * @param {number} loanId - Loan ID
 * @param {Object} loanData - Loan update data
 * @returns {Promise<Object>} Updated loan
 */
export const updateLoan = async (loanId, loanData) => {
  try {
    const response = await apiClient.patch(`/loans/${loanId}`, loanData);
    return response.data;
  } catch (error) {
    console.error('Update loan error:', error);
    throw error;
  }
};

/**
 * Delete a loan (Admin only - use with caution)
 * @param {number} loanId - Loan ID
 * @returns {Promise<void>}
 */
export const deleteLoan = async (loanId) => {
  try {
    await apiClient.delete(`/loans/${loanId}`);
  } catch (error) {
    console.error('Delete loan error:', error);
    throw error;
  }
};

/**
 * Mark all overdue loans (Admin/System only)
 * @returns {Promise<Object>} Count of loans marked overdue
 */
export const markOverdueLoans = async () => {
  try {
    const response = await apiClient.post('/loans/mark-overdue');
    return response.data;
  } catch (error) {
    console.error('Mark overdue loans error:', error);
    throw error;
  }
};

/**
 * Get all loan policies
 * @returns {Promise<Array>} List of loan policies by role
 */
export const getAllLoanPolicies = async () => {
  try {
    const response = await apiClient.get('/loans/policies/all');
    return response.data;
  } catch (error) {
    console.error('Get all loan policies error:', error);
    throw error;
  }
};

/**
 * Get loan policy for a specific role
 * @param {string} role - User role (student, professor, ta, admin)
 * @returns {Promise<Object>} Loan policy (max_books, loan_days)
 */
export const getLoanPolicy = async (role) => {
  try {
    const response = await apiClient.get(`/loans/policies/${role}`);
    return response.data;
  } catch (error) {
    console.error('Get loan policy error:', error);
    throw error;
  }
};

export default {
  getAllLoans,
  getLoansByStatus,
  getUserLoans,
  getOverdueLoans,
  getLoan,
  searchLoans,
  createLoanRequest,
  approveLoan,
  rejectLoan,
  returnLoan,
  updateLoan,
  deleteLoan,
  markOverdueLoans,
  getAllLoanPolicies,
  getLoanPolicy,
};
