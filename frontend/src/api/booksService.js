import { apiClient } from './config';

/**
 * Books Service
 * Handles all book-related API operations
 */

/**
 * Get all books with pagination
 * @param {number} skip - Number of books to skip
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array>} List of books
 */
export const getBooks = async (skip = 0, limit = 50) => {
  try {
    const response = await apiClient.get('/books/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get books error:', error);
    throw error;
  }
};

/**
 * Get a specific book by ID
 * @param {number} bookId - Book ID
 * @returns {Promise<Object>} Book details
 */
export const getBook = async (bookId) => {
  try {
    const response = await apiClient.get(`/books/${bookId}`);
    return response.data;
  } catch (error) {
    console.error('Get book error:', error);
    throw error;
  }
};

/**
 * Search books by title, author, or ISBN
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of matching books
 */
export const searchBooks = async (query) => {
  try {
    const response = await apiClient.get('/books/search/', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Search books error:', error);
    throw error;
  }
};

/**
 * Create a new book (Admin only)
 * @param {Object} bookData - Book creation data
 * @returns {Promise<Object>} Created book
 */
export const createBook = async (bookData) => {
  try {
    const response = await apiClient.post('/books/', bookData);
    return response.data;
  } catch (error) {
    console.error('Create book error:', error);
    throw error;
  }
};

/**
 * Update a book (Admin only)
 * @param {number} bookId - Book ID
 * @param {Object} bookData - Book update data
 * @returns {Promise<Object>} Updated book
 */
export const updateBook = async (bookId, bookData) => {
  try {
    const response = await apiClient.put(`/books/${bookId}`, bookData);
    return response.data;
  } catch (error) {
    console.error('Update book error:', error);
    throw error;
  }
};

/**
 * Partially update a book (Admin only)
 * @param {number} bookId - Book ID
 * @param {Object} bookData - Partial book update data
 * @returns {Promise<Object>} Updated book
 */
export const partialUpdateBook = async (bookId, bookData) => {
  try {
    const response = await apiClient.patch(`/books/${bookId}`, bookData);
    return response.data;
  } catch (error) {
    console.error('Partial update book error:', error);
    throw error;
  }
};

/**
 * Delete a book (Admin only)
 * @param {number} bookId - Book ID
 * @returns {Promise<void>}
 */
export const deleteBook = async (bookId) => {
  try {
    await apiClient.delete(`/books/${bookId}`);
  } catch (error) {
    console.error('Delete book error:', error);
    throw error;
  }
};

/**
 * Get books with copy statistics included (optimized endpoint)
 * Uses the backend's /books/with-stats endpoint for a single DB query
 * @param {number} skip - Number of books to skip
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array>} List of books with copy_stats included
 */
export const getBooksWithStats = async (skip = 0, limit = 50) => {
  try {
    const response = await apiClient.get('/books/with-stats', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get books with stats error:', error);
    throw error;
  }
};

/**
 * Get books with copy statistics AND course associations (optimized endpoint)
 * Uses the backend's /books/with-stats-and-courses endpoint for a single DB query
 * @param {number} skip - Number of books to skip
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Array>} List of books with copy_stats and courses included
 */
export const getBooksWithStatsAndCourses = async (skip = 0, limit = 50) => {
  try {
    const response = await apiClient.get('/books/with-stats-and-courses', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get books with stats and courses error:', error);
    throw error;
  }
};

export default {
  getBooks,
  getBook,
  searchBooks,
  createBook,
  updateBook,
  partialUpdateBook,
  deleteBook,
  getBooksWithStats,
  getBooksWithStatsAndCourses,
};
