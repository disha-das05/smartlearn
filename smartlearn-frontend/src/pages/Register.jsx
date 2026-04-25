// ============================================
// SmartLearn - Register Page
// ============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      await login({ email: formData.email, password: formData.password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
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
          <h2 className="auth-title">Create Account !</h2>
          <p className="auth-subtitle">Start your smart learning journey today</p>
        </motion.div>

        {error && (
          <motion.div className="error-msg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <motion.div className="input-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <FiUser className="input-icon" />
            <input type="text" name="name" placeholder="Full name"
              value={formData.name} onChange={handleChange} required />
          </motion.div>

          <motion.div className="input-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <FiMail className="input-icon" />
            <input type="email" name="email" placeholder="Email address"
              value={formData.email} onChange={handleChange} required />
          </motion.div>

          <motion.div className="input-group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
            <FiLock className="input-icon" />
            <input type={showPassword ? 'text' : 'password'} name="password"
              placeholder="Password (min 6 characters)" value={formData.password} onChange={handleChange} required />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </motion.div>

          <motion.button type="submit" className="auth-btn" disabled={loading}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="loading-spinner" /> : 'Create Account'}
          </motion.button>
        </form>

        <motion.p className="auth-switch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          Already have an account? <Link to="/login">Login here</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;