// ============================================
// SmartLearn - Login Page
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="bg-circle circle-1" />
      <div className="bg-circle circle-2" />
      <div className="bg-circle circle-3" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="auth-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <img src={logo} alt="SmartLearn" className="auth-logo-img" />
          <h1>SmartLearn</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h2 className="auth-title">Welcome Back!</h2>
          <p className="auth-subtitle">Login to continue your learning journey</p>
        </motion.div>

        {error && (
          <motion.div className="error-msg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <motion.div className="input-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <FiMail className="input-icon" />
            <input type="email" name="email" placeholder="Email address"
              value={formData.email} onChange={handleChange} required />
          </motion.div>

          <motion.div className="input-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <FiLock className="input-icon" />
            <input type={showPassword ? 'text' : 'password'} name="password"
              placeholder="Password" value={formData.password} onChange={handleChange} required />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </motion.div>

          <motion.button type="submit" className="auth-btn" disabled={loading}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="loading-spinner" /> : 'Login'}
          </motion.button>
        </form>

        <motion.p className="auth-switch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          Don't have an account? <Link to="/register">Create one here</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;