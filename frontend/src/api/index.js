/**
 * API Services Index
 * Central export point for all API services
 */

export * as authService from './authService';
export * as booksService from './booksService';
export * as bookCopiesService from './bookCopiesService';
export * as usersService from './usersService';
export * as loansService from './loansService';
export * as coursesService from './coursesService';
export * as statsService from './statsService';

// Also export the config for direct access if needed
export { apiClient, API_BASE_URL } from './config';
