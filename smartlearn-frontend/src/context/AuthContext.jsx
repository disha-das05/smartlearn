// ============================================
// SmartLearn - Auth Context
// This manages the login state across the whole app
// ============================================

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

// Create the context
const AuthContext = createContext();

// Custom hook to use auth context easily
export const useAuth = () => useContext(AuthContext);

// Auth Provider - wraps the whole app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // When app loads, check if user is already logged in
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          setUser(res.data);
        } catch (err) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  // Register function
  const register = async (userData) => {
    const res = await authAPI.register(userData);
    return res.data;
  };

  // Login function
  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token, user } = res.data;

    // Save token to localStorage
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);

    return res.data;
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Values available to all components
  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};