// ============================================
// SmartLearn - API Service
// This file handles all communication with the backend
// ============================================

import axios from 'axios';

// Base URL of your backend
const API_URL = import.meta.evn.VITE_API_URL;

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ----------------------------------------
// Automatically attach token to every request
// So we don't have to manually add it every time
// ----------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------------------
// Handle responses - if token expired, logout
// ----------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================
export const authAPI = {
  // Register new user
  register: (userData) => api.post('/auth/register', userData),

  // Login user
  login: (credentials) => api.post('/auth/login', credentials),

  // Get logged in user profile
  getProfile: () => api.get('/auth/profile'),
};

// ============================================
// SUBJECTS API CALLS
// ============================================
export const subjectsAPI = {
  // Get all subjects
  getAll: () => api.get('/subjects'),

  // Get single subject
  getOne: (id) => api.get(`/subjects/${id}`),

  // Create new subject
  create: (subjectData) => api.post('/subjects', subjectData),

  // Update subject
  update: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),

  // Delete subject
  delete: (id) => api.delete(`/subjects/${id}`),
};

// ============================================
// TASKS API CALLS
// ============================================
export const tasksAPI = {
  // Get all tasks (with optional filters)
  getAll: (filters = {}) => api.get('/tasks', { params: filters }),

  // Get pending tasks only
  getPending: () => api.get('/tasks/pending'),

  // Get single task
  getOne: (id) => api.get(`/tasks/${id}`),

  // Create new task
  create: (taskData) => api.post('/tasks', taskData),

  // Update task
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),

  // Mark task as complete
  complete: (id) => api.patch(`/tasks/${id}/complete`),

  // Update task status
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),

  // Delete task
  delete: (id) => api.delete(`/tasks/${id}`),
};

// ============================================
// STUDY PLANNER API CALLS
// ============================================
export const plannerAPI = {
  // Generate a new study plan
  generate: (data) => api.post('/planner/generate', data),

  // Get current study plan
  getPlan: () => api.get('/planner'),

  // Get today's study sessions
  getToday: () => api.get('/planner/today'),

  // Delete study plan
  deletePlan: () => api.delete('/planner'),
};

export default api;