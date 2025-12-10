import axios from 'axios';

/**
 * Base URL untuk backend API
 * Untuk mengubah URL backend, buat file .env di root frontend dengan:
 * VITE_API_URL=http://localhost:3333
 * 
 * Default: http://localhost:3333 (default AdonisJS port)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
  return response.data;
};

// Get warnet detail
export const getWarnetDetail = async (id: number) => {
  const response = await api.get(`/warnets/${id}`);
  return response.data;
};

export default api;

