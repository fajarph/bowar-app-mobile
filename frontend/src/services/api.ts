import axios from 'axios';

/**
 * Base URL untuk backend API
 * Untuk mengubah URL backend, buat file .env di root frontend dengan:
 * VITE_API_URL=http://localhost:3333
 * 
 * Default: http://localhost:3333 (default AdonisJS port)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3333';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
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

// Handle 401 responses (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // You might want to redirect here if using React Router
    }
    return Promise.reject(error);
  }
);

// Register User (Regular)
export const registerUser = async (data: {
  username: string;
  email: string;
  password: string;
}) => {
  const response = await api.post('/register/user', data);
  return response.data;
};

// Register Member
export const registerMember = async (data: {
  username: string;
  email: string;
  password: string;
  warnet_id: number;
}) => {
  const response = await api.post('/register/member', data);
  return response.data;
};

// Get all warnets
export const getWarnets = async () => {
  const response = await api.get('/warnets');
  // Backend shape: { message, data: Warnet[] }
  return response.data.data;
};

// Get warnet detail
export const getWarnetDetail = async (id: number) => {
  const response = await api.get(`/warnets/${id}`);
  return response.data;
};

// Login (SESUIAI AuthController AdonisJS v6)
export const login = async (data: {
  username: string;
  password: string;
}) => {
  const response = await api.post('/login', data);

  /**
   * Response backend:
   * {
   *   message: string,
   *   user: { id, username, email, role },
   *   token: { type, value, expiresAt }
   * }
   */

  if (response.data?.token?.value) {
    localStorage.setItem('auth_token', response.data.token.value);
    localStorage.setItem(
      'auth_user',
      JSON.stringify(response.data.user)
    );
  }

  return response.data;
};


// Clear auth data
export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

// Get stored user
export const getStoredUser = () => {
  const userStr = localStorage.getItem('auth_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Get profile
export const getProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

// Logout
export const logout = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export default api;

