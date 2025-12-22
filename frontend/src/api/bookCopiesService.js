import { apiClient } from './config';

/**
 * Book Copies Service
 * Handles all book copy/inventory operations
 */

/**
 * Get all book copies with pagination
 * @param {number} skip - Number of copies to skip
 * @param {number} limit - Maximum number of copies to return
 * @returns {Promise<Array>} List of book copies
 */
export const getAllCopies = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get('/book-copies/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get all copies error:', error);
    throw error;
  }
};

/**
 * Get all copies of a specific book
 * @param {number} bookId - Book ID
 * @param {boolean} availableOnly - Filter to only available copies
 * @returns {Promise<Array>} List of book copies
 */
export const getCopiesByBook = async (bookId, availableOnly = false) => {
  try {
    const response = await apiClient.get(`/book-copies/book/${bookId}`, {
      params: { available_only: availableOnly }
    });
    return response.data;
  } catch (error) {
    console.error('Get copies by book error:', error);
    throw error;
  }
};

/**
 * Get statistics for book copies
 * @param {number} bookId - Book ID
 * @returns {Promise<Object>} Copy statistics (total, available, reference, circulating)
 */
export const getCopyStats = async (bookId) => {
  try {
    const response = await apiClient.get(`/book-copies/book/${bookId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Get copy stats error:', error);
    throw error;
  }
};

/**
 * Get a copy by its barcode/accession number
 * @param {string} accessionNumber - Barcode/accession number
 * @returns {Promise<Object>} Book copy details
 */
export const getCopyByBarcode = async (accessionNumber) => {
  try {
    const response = await apiClient.get(`/book-copies/accession/${accessionNumber}`);
    return response.data;
  } catch (error) {
    console.error('Get copy by barcode error:', error);
    throw error;
  }
};

/**
 * Get a specific copy by ID
 * @param {number} copyId - Copy ID
 * @returns {Promise<Object>} Book copy details
 */
export const getCopy = async (copyId) => {
  try {
    const response = await apiClient.get(`/book-copies/${copyId}`);
    return response.data;
  } catch (error) {
    console.error('Get copy error:', error);
    throw error;
  }
};

/**
 * Create a single book copy (Admin only)
 * @param {Object} copyData - Copy creation data
 * @returns {Promise<Object>} Created copy
 */
export const createCopy = async (copyData) => {
  try {
    const response = await apiClient.post('/book-copies/', copyData);
    return response.data;
  } catch (error) {
    console.error('Create copy error:', error);
    throw error;
  }
};

/**
 * Create multiple book copies at once (Admin only)
 * @param {number} bookId - Book ID
 * @param {number} quantity - Number of copies to create
 * @param {number} referencePercentage - Percentage to mark as reference (default 30)
 * @returns {Promise<Array>} Created copies
 */
export const createBulkCopies = async (bookId, quantity, referencePercentage = 30) => {
  try {
    const response = await apiClient.post('/book-copies/bulk', 
      { book_id: bookId, quantity },
      { params: { reference_percentage: referencePercentage } }
    );
    return response.data;
  } catch (error) {
    console.error('Create bulk copies error:', error);
    throw error;
  }
};

/**
 * Update a book copy (Admin only)
 * @param {number} copyId - Copy ID
 * @param {Object} copyData - Copy update data
 * @returns {Promise<Object>} Updated copy
 */
export const updateCopy = async (copyId, copyData) => {
  try {
    const response = await apiClient.patch(`/book-copies/${copyId}`, copyData);
    return response.data;
  } catch (error) {
    console.error('Update copy error:', error);
    throw error;
  }
};

/**
 * Update copy status quickly (Admin only)
 * @param {number} copyId - Copy ID
 * @param {string} status - New status (available, maintenance, lost)
 * @returns {Promise<Object>} Updated copy
 */
export const updateCopyStatus = async (copyId, status) => {
  try {
    const response = await apiClient.patch(`/book-copies/${copyId}/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Update copy status error:', error);
    throw error;
  }
};

/**
 * Delete a book copy
 * @param {number} copyId - Copy ID
 * @returns {Promise<void>}
 */
export const deleteCopy = async (copyId) => {
  try {
    await apiClient.delete(`/book-copies/${copyId}`);
  } catch (error) {
    console.error('Delete copy error:', error);
    throw error;
  }
};

export default {
  getAllCopies,
  getCopiesByBook,
  getCopyStats,
  getCopyByBarcode,
  getCopy,
  createCopy,
  createBulkCopies,
  updateCopy,
  updateCopyStatus,
  deleteCopy,
};
