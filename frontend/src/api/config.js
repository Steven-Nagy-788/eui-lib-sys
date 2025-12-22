import axios from 'axios';

// Base API URL - Update this based on your backend deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized - redirect to login
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      
      // Format error message
      const message = data?.detail || data?.message || 'An error occurred';
      error.message = typeof message === 'string' ? message : JSON.stringify(message);
    } else if (error.request) {
      // Request made but no response
      error.message = 'No response from server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

export { apiClient, API_BASE_URL };
