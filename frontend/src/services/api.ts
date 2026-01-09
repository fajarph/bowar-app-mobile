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
    // List of public endpoints that don't require authentication
    const publicEndpoints = [
      '/login',
      '/register',
      '/warnets',
    ];
    
    // Check if this is a public endpoint (exact match or starts with)
    const isPublicEndpoint = config.url && publicEndpoints.some(endpoint => {
      const url = config.url || '';
      return url === endpoint || url.startsWith(endpoint + '/');
    });
    
    const token = localStorage.getItem('auth_token');
    if (token && token.trim().length > 0) {
      // Ensure token doesn't already have "Bearer " prefix
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7).trim() : token.trim();
      
      // Set Authorization header (both lowercase and capitalized for compatibility)
      config.headers.Authorization = `Bearer ${cleanToken}`;
      config.headers.authorization = `Bearer ${cleanToken}`; // Also set lowercase version
      
      // Debug logging in development
      if (import.meta.env.DEV && !isPublicEndpoint) {
        console.log('✅ Token added to request:', config.url);
        console.log('   Token length:', cleanToken.length);
        console.log('   Token preview:', cleanToken.substring(0, 30) + '...');
        console.log('   Authorization header set:', !!config.headers.Authorization);
        console.log('   Full Authorization header:', config.headers.Authorization?.substring(0, 50) + '...');
      }
    } else if (!isPublicEndpoint) {
      // Only warn for protected endpoints in development
      if (import.meta.env.DEV) {
        console.warn('⚠️ No auth token found in localStorage for protected request:', config.url);
        console.warn('   Available localStorage keys:', Object.keys(localStorage));
      }
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
      // Check if this is an operator request
      const url = error.config?.url || '';
      const isOperatorRequest = url.includes('/operator/') || 
                                url.includes('/bowar-transactions') && 
                                localStorage.getItem('auth_operator');
      
      // For operator requests, don't automatically clear operator data
      // Let the component handle the error gracefully
      if (!isOperatorRequest) {
        // Only clear for regular user requests
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      // Note: auth_operator is not cleared here, let component handle it
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

// Register Operator - REMOVED for security
// Operators should be created by admin only, not self-registration

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

  // Handle token - AdonisJS createToken returns an AccessToken object
  // The token object has a .value property that contains the actual token string
  if (response.data?.token) {
    let tokenValue: string | null = null;
    
    // Log token structure for debugging
    console.log('🔍 Token structure:', {
      type: typeof response.data.token,
      isObject: typeof response.data.token === 'object',
      keys: typeof response.data.token === 'object' ? Object.keys(response.data.token) : 'N/A',
      hasValue: !!(response.data.token as any)?.value,
      valueType: typeof (response.data.token as any)?.value,
    });
    
    if (typeof response.data.token === 'string') {
      // If token is already a string (shouldn't happen with AdonisJS, but handle it)
      tokenValue = response.data.token;
      console.log('⚠️ Token is string (unexpected)');
    } else if (response.data.token && typeof response.data.token === 'object') {
      // AdonisJS createToken returns object with .value property
      const tokenObj = response.data.token as any;
      tokenValue = tokenObj.value || tokenObj.token || tokenObj.hash || null;
      
      if (!tokenValue && tokenObj.toString) {
        // Try toString as last resort
        const str = tokenObj.toString();
        if (str && str !== '[object Object]') {
          tokenValue = str;
        }
      }
    }
    
    if (tokenValue && typeof tokenValue === 'string' && tokenValue.length > 0) {
      localStorage.setItem('auth_token', tokenValue);
      // Verify token was saved
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken === tokenValue) {
        console.log('✅ Token saved to localStorage');
        console.log('   Token length:', tokenValue.length);
        console.log('   Token preview:', tokenValue.substring(0, 30) + '...');
      } else {
        console.error('❌ Token save verification failed');
      }
    } else {
      console.error('❌ Token value not found or invalid in response:', {
        token: response.data.token,
        tokenType: typeof response.data.token,
        tokenKeys: response.data.token && typeof response.data.token === 'object' 
          ? Object.keys(response.data.token) 
          : 'N/A',
        tokenValue: tokenValue,
      });
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

// Get all memberships for user's email (from all accounts with same email)
export const getAllMemberships = async () => {
  const response = await api.get('/profile/all-memberships');
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
// For operators: can get pending topups by passing status='pending' and type='topup'
export const getBowarTransactions = async (page = 1, limit = 20, status?: string, type?: string) => {
  // Verify token exists before making request
  const token = localStorage.getItem('auth_token');
  if (!token || token.trim().length === 0) {
    console.error('❌ No token found in localStorage for getBowarTransactions');
    throw new Error('No authentication token found');
  }
  
  // Log token info for debugging (only in dev mode)
  if (import.meta.env.DEV) {
    console.log('🔍 getBowarTransactions - Token exists, length:', token.length);
    console.log('   Token preview:', token.substring(0, 30) + '...');
    console.log('   Request params:', { page, limit, status, type });
  }
  
  try {
    const response = await api.get('/bowar-transactions', {
      params: { page, limit, ...(status && { status }), ...(type && { type }) },
    });
    return response.data;
  } catch (error: any) {
    // Log detailed error info
    if (import.meta.env.DEV) {
      console.error('❌ getBowarTransactions error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url,
        headers: error.config?.headers,
      });
    }
    throw error;
  }
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
export const rejectTopup = async (transactionId: number, rejectionNote?: string) => {
  const response = await api.patch(`/bowar-transactions/${transactionId}/reject`, {
    rejection_note: rejectionNote || null,
  });
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

// ============================================
// OPERATOR APIs
// ============================================

// Get all members for a warnet (for operators)
export const getWarnetMembers = async (warnetId: number) => {
  const response = await api.get(`/operator/warnet/${warnetId}/members`);
  return response.data;
};

// Get statistics for a warnet (for operators)
export const getWarnetStatistics = async (warnetId: number, startDate?: string, endDate?: string) => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get(`/operator/warnet/${warnetId}/statistics`, { params });
  return response.data;
};

export default api;

