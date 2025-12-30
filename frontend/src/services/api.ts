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

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found in localStorage');
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
  return response.data?.data || [];
};

// Get warnet detail
export const getWarnetDetail = async (id: number) => {
  const response = await api.get(`/warnets/${id}`);
  // Backend shape: { message, data: WarnetDetail }
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
   *   token: { type, value, expiresAt } or token object
   * }
   */

  // Handle token - AdonisJS returns token object with value property
  if (response.data?.token) {
    // Token can be either an object with .value or a string
    const tokenValue = typeof response.data.token === 'string' 
      ? response.data.token 
      : response.data.token.value || response.data.token.token;
    
    if (tokenValue) {
      localStorage.setItem('auth_token', tokenValue);
      localStorage.setItem(
        'auth_user',
        JSON.stringify(response.data.user)
      );
      console.log('✅ Token saved to localStorage');
    } else {
      console.error('❌ Token value not found in response:', response.data.token);
    }
  } else {
    console.error('❌ No token in login response:', response.data);
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

// ============================================
// USER PROFILE APIs
// ============================================

// Update user profile
export const updateProfile = async (data: {
  username?: string;
  email?: string;
  avatar?: string;
}) => {
  const response = await api.patch('/profile', data);
  return response.data;
};

// Get user profile with cafe wallets
export const getUserProfile = async () => {
  const response = await api.get('/profile');
  return response.data;
};

// Get user wallets (alias for /profile/wallets)
export const getUserWallets = async () => {
  const response = await api.get('/profile/wallets');
  return response.data;
};

// ============================================
// CAFE WALLET APIs
// ============================================

// Get all cafe wallets for authenticated user
export const getCafeWallets = async () => {
  const response = await api.get('/cafe-wallets');
  return response.data;
};

// Get cafe wallet for specific warnet
export const getCafeWalletByWarnet = async (warnetId: number) => {
  const response = await api.get(`/cafe-wallets/${warnetId}`);
  return response.data;
};

// Add time to cafe wallet (after payment)
export const addTimeToWallet = async (data: {
  warnetId: number;
  minutes: number;
}) => {
  const response = await api.post('/cafe-wallets', {
    warnetId: data.warnetId,
    minutes: data.minutes,
  });
  return response.data;
};

// Activate wallet (when user logs in at cafe)
export const activateWallet = async (walletId: number) => {
  const response = await api.patch(`/cafe-wallets/${walletId}/activate`);
  return response.data;
};

// Deactivate wallet (when user logs out)
export const deactivateWallet = async (walletId: number) => {
  const response = await api.patch(`/cafe-wallets/${walletId}/deactivate`);
  return response.data;
};

// Update wallet remaining time (for countdown)
export const updateWalletTime = async (walletId: number, remainingMinutes: number) => {
  const response = await api.patch(`/cafe-wallets/${walletId}/update-time`, {
    remainingMinutes,
  });
  return response.data;
};

// ============================================
// BOWAR TRANSACTION APIs
// ============================================

// Get all transactions for authenticated user
export const getBowarTransactions = async (page = 1, limit = 20) => {
  const response = await api.get('/bowar-transactions', {
    params: { page, limit },
  });
  return response.data;
};

// Get transaction detail
export const getBowarTransaction = async (transactionId: number) => {
  const response = await api.get(`/bowar-transactions/${transactionId}`);
  return response.data;
};

// Top up DompetBowar (via transfer - pending approval)
export const topupBowar = async (data: {
  amount: number;
  description?: string;
  proofImage: string;
  senderName: string;
}) => {
  const response = await api.post('/bowar-transactions/topup', data);
  return response.data;
};

// Payment via DompetBowar
export const paymentBowar = async (data: {
  bookingId: number;
  amount: number;
  description?: string;
}) => {
  const response = await api.post('/bowar-transactions/payment', data);
  return response.data;
};

// Refund to DompetBowar
export const refundBowar = async (data: {
  bookingId?: number;
  amount: number;
  description?: string;
}) => {
  const response = await api.post('/bowar-transactions/refund', data);
  return response.data;
};

// Approve topup (for operator)
export const approveTopup = async (transactionId: number) => {
  const response = await api.patch(`/bowar-transactions/${transactionId}/approve`);
  return response.data;
};

// Reject topup (for operator)
export const rejectTopup = async (transactionId: number) => {
  const response = await api.patch(`/bowar-transactions/${transactionId}/reject`);
  return response.data;
};

// ============================================
// WARNET APIs (Additional)
// ============================================

// Get warnet rules
export const getWarnetRules = async (warnetId: number) => {
  const response = await api.get(`/warnets/${warnetId}/rules`);
  return response.data;
};

export default api;

