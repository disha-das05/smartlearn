import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHome, FiBook, FiCheckSquare, FiCalendar,
  FiTrendingUp, FiCpu, FiLogOut, FiMenu, FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './DashboardLayout.css';

const navItems = [
  { icon: <FiHome />, label: 'Dashboard', path: '/dashboard' },
  { icon: <FiBook />, label: 'Subjects', path: '/subjects' },
  { icon: <FiCheckSquare />, label: 'Tasks', path: '/tasks' },
  { icon: <FiCalendar />, label: 'Study Planner', path: '/planner' },
  { icon: <FiTrendingUp />, label: 'Progress', path: '/progress' },
  { icon: <FiBook />, label: 'Learning', path: '/learning' },
  { icon: <FiCpu />, label: 'AI Assistant', path: '/ai' },
];

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="dashboard-layout">
      <div className="dash-bg" />
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <motion.aside
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        initial={{ x: -240 }} animate={{ x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* ── Logo ── */}
        <div className="sidebar-logo">
          <img src={logo} alt="SmartLearn" className="sidebar-logo-img" />
          <div className="logo-text-wrapper">
            <span className="logo-text">SmartLearn</span>
            <span className="logo-tagline">Study Smarter</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) => (
            <motion.div
              key={i}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="nav-icon">{item.icon}</div>
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <motion.div className="active-indicator" layoutId="activeIndicator" />
              )}
            </motion.div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Student'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
          </div>
          <motion.button
            className="logout-btn" onClick={handleLogout}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <FiLogOut /><span>Logout</span>
          </motion.button>
        </div>
      </motion.aside>

      <div className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;