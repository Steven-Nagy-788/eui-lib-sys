import { apiClient } from './config';

/**
 * Courses Service
 * Handles all course, enrollment, and course book operations
 */

// ===== COURSES =====

/**
 * Get all courses with pagination
 * @param {number} skip - Number of courses to skip
 * @param {number} limit - Maximum number of courses to return
 * @returns {Promise<Array>} List of courses
 */
export const getAllCourses = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get('/courses/', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get all courses error:', error);
    throw error;
  }
};

/**
 * Get a specific course by code
 * @param {string} courseCode - Course code
 * @returns {Promise<Object>} Course details
 */
export const getCourse = async (courseCode) => {
  try {
    const response = await apiClient.get(`/courses/${courseCode}`);
    return response.data;
  } catch (error) {
    console.error('Get course error:', error);
    throw error;
  }
};

/**
 * Get all courses for a specific faculty
 * @param {string} faculty - Faculty name
 * @returns {Promise<Array>} List of courses
 */
export const getCoursesByFaculty = async (faculty) => {
  try {
    const response = await apiClient.get(`/courses/faculty/${faculty}`);
    return response.data;
  } catch (error) {
    console.error('Get courses by faculty error:', error);
    throw error;
  }
};

/**
 * Create a new course (Admin only)
 * @param {Object} courseData - Course creation data
 * @returns {Promise<Object>} Created course
 */
export const createCourse = async (courseData) => {
  try {
    const response = await apiClient.post('/courses/', courseData);
    return response.data;
  } catch (error) {
    console.error('Create course error:', error);
    throw error;
  }
};

/**
 * Update a course (Admin only)
 * @param {string} courseCode - Course code
 * @param {Object} courseData - Course update data
 * @returns {Promise<Object>} Updated course
 */
export const updateCourse = async (courseCode, courseData) => {
  try {
    const response = await apiClient.patch(`/courses/${courseCode}`, courseData);
    return response.data;
  } catch (error) {
    console.error('Update course error:', error);
    throw error;
  }
};

/**
 * Delete a course (Admin only)
 * @param {string} courseCode - Course code
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseCode) => {
  try {
    await apiClient.delete(`/courses/${courseCode}`);
  } catch (error) {
    console.error('Delete course error:', error);
    throw error;
  }
};

// ===== ENROLLMENTS =====

/**
 * Get all enrollments with pagination
 * @param {number} skip - Number of enrollments to skip
 * @param {number} limit - Maximum number of enrollments to return
 * @returns {Promise<Array>} List of enrollments
 */
export const getAllEnrollments = async (skip = 0, limit = 100) => {
  try {
    const response = await apiClient.get('/courses/enrollments/all', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Get all enrollments error:', error);
    throw error;
  }
};

/**
 * Get a specific enrollment by ID
 * @param {number} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Enrollment details
 */
export const getEnrollment = async (enrollmentId) => {
  try {
    const response = await apiClient.get(`/courses/enrollments/${enrollmentId}`);
    return response.data;
  } catch (error) {
    console.error('Get enrollment error:', error);
    throw error;
  }
};

/**
 * Get all students enrolled in a specific course
 * @param {string} courseCode - Course code
 * @returns {Promise<Array>} List of enrollments
 */
export const getCourseEnrollments = async (courseCode) => {
  try {
    const response = await apiClient.get(`/courses/${courseCode}/enrollments`);
    return response.data;
  } catch (error) {
    console.error('Get course enrollments error:', error);
    throw error;
  }
};

/**
 * Get all courses a student is enrolled in
 * @param {number} studentId - Student ID
 * @returns {Promise<Array>} List of enrollments
 */
export const getStudentEnrollments = async (studentId) => {
  try {
    const response = await apiClient.get(`/courses/enrollments/student/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Get student enrollments error:', error);
    throw error;
  }
};

/**
 * Enroll a student in a course (Admin only)
 * @param {Object} enrollmentData - Enrollment data (student_id, course_code, semester)
 * @returns {Promise<Object>} Created enrollment
 */
export const enrollStudent = async (enrollmentData) => {
  try {
    const response = await apiClient.post('/courses/enrollments', enrollmentData);
    return response.data;
  } catch (error) {
    console.error('Enroll student error:', error);
    throw error;
  }
};

/**
 * Remove a student enrollment by enrollment ID (Admin only)
 * @param {number} enrollmentId - Enrollment ID
 * @returns {Promise<void>}
 */
export const unenrollStudent = async (enrollmentId) => {
  try {
    await apiClient.delete(`/courses/enrollments/${enrollmentId}`);
  } catch (error) {
    console.error('Unenroll student error:', error);
    throw error;
  }
};

/**
 * Remove a student from a specific course (Admin only)
 * @param {number} studentId - Student ID
 * @param {string} courseCode - Course code
 * @returns {Promise<void>}
 */
export const unenrollStudentFromCourse = async (studentId, courseCode) => {
  try {
    await apiClient.delete(`/courses/enrollments/student/${studentId}/course/${courseCode}`);
  } catch (error) {
    console.error('Unenroll student from course error:', error);
    throw error;
  }
};

// ===== COURSE BOOKS =====

/**
 * Get all books required for a course
 * @param {string} courseCode - Course code
 * @returns {Promise<Array>} List of books
 */
export const getCourseBooks = async (courseCode) => {
  try {
    const response = await apiClient.get(`/courses/${courseCode}/books`);
    return response.data;
  } catch (error) {
    console.error('Get course books error:', error);
    throw error;
  }
};

/**
 * Get all courses that require a specific book
 * @param {number} bookId - Book ID
 * @returns {Promise<Array>} List of courses
 */
export const getBookCourses = async (bookId) => {
  try {
    const response = await apiClient.get(`/courses/books/${bookId}/courses`);
    return response.data;
  } catch (error) {
    console.error('Get book courses error:', error);
    throw error;
  }
};

/**
 * Associate a book with a course (Admin only)
 * @param {Object} courseBookData - Course book data (course_code, book_id)
 * @returns {Promise<Object>} Created course book association
 */
export const addBookToCourse = async (courseBookData) => {
  try {
    const response = await apiClient.post('/courses/course-books', courseBookData);
    return response.data;
  } catch (error) {
    console.error('Add book to course error:', error);
    throw error;
  }
};

/**
 * Remove a book from a course (Admin only)
 * @param {string} courseCode - Course code
 * @param {number} bookId - Book ID
 * @returns {Promise<void>}
 */
export const removeBookFromCourse = async (courseCode, bookId) => {
  try {
    await apiClient.delete(`/courses/${courseCode}/books/${bookId}`);
  } catch (error) {
    console.error('Remove book from course error:', error);
    throw error;
  }
};

export default {
  // Courses
  getAllCourses,
  getCourse,
  getCoursesByFaculty,
  createCourse,
  updateCourse,
  deleteCourse,
  // Enrollments
  getAllEnrollments,
  getEnrollment,
  getCourseEnrollments,
  getStudentEnrollments,
  enrollStudent,
  unenrollStudent,
  unenrollStudentFromCourse,
  // Course Books
  getCourseBooks,
  getBookCourses,
  addBookToCourse,
  removeBookFromCourse,
};
