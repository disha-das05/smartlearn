//cat > /mnt/user-data/outputs/Dashboard-updated.jsx << 'JSXEOF'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBook, FiCheckSquare, FiClock, FiZap, FiCalendar, FiCpu, FiTrendingUp, FiPlus, FiAlertTriangle, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { subjectsAPI, tasksAPI, plannerAPI } from '../services/api';
import './Dashboard.css';

const StatCard = ({ icon, number, label, color, delay }) => (
  <motion.div className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }} whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(108,99,255,0.12)' }}>
    <div className="stat-icon" style={{ background: color }}>{icon}</div>
    <div className="stat-number">{number}</div>
    <div className="stat-label">{label}</div>
  </motion.div>
);

const SessionItem = ({ session, index }) => (
  <motion.div className="session-item" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}>
    <div className="session-bar" style={{ background: session.subject?.color || '#6C63FF' }} />
    <div className="session-info">
      <div className="session-title">{session.title}</div>
      <div className="session-sub">
        {session.subject?.name || 'Unknown'} •{' '}
        <span className={`priority-badge priority-${session.priority}`}>{session.priority}</span>
      </div>
    </div>
    <div className="session-hours">{session.hoursToStudy}h</div>
  </motion.div>
);

const WarningItem = ({ warning, index }) => (
  <motion.div className={`warning-item ${warning.type === 'overdue' ? 'warning-overdue' : 'warning-urgent'}`}
    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
    <span className="warning-emoji">{warning.type === 'overdue' ? '🚨' : '⚠️'}</span>
    <div>
      <div className="warning-text">{warning.taskTitle}</div>
      <div className="warning-sub">{warning.message}</div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ subjects: 0, pendingTasks: 0, completedTasks: 0, streak: 7 });
  const [todaySessions, setTodaySessions] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const subjectsRes = await subjectsAPI.getAll();
        const subjects = subjectsRes.data;
        const tasksRes = await tasksAPI.getAll();
        const tasks = tasksRes.data;
        const pendingTasks = tasks.filter(t => t.status !== 'completed');
        const completedTasks = tasks.filter(t => t.status === 'completed');

        setStats({
          subjects: subjects.length,
          pendingTasks: pendingTasks.length,
          completedTasks: completedTasks.length,
          streak: 7,
        });

        try {
          const planRes = await plannerAPI.getToday();
          setTodaySessions(planRes.data.sessions || []);
          setWarnings(planRes.data.warnings || []);
        } catch {
          setTodaySessions([]);
          setWarnings([]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDate = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="loading-spinner-large" />
          <p>Loading your dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page">

        {/* NEW WELCOME SECTION WITH GREETING, DATE & STATUS */}
        <motion.div className="welcome-section-new" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <div className="welcome-content">
            <h1 className="welcome-title">
              Welcome back, <span className="name-gradient">{user?.name?.split(' ')[0] || 'Student'}</span>! 🎓
            </h1>
            <p className="welcome-greeting">    • {getDate()}</p>
            <p className="welcome-status">
              {stats.pendingTasks > 0
                ? `You have ${stats.pendingTasks} pending task${stats.pendingTasks > 1 ? 's' : ''}. Let's get studying!`
                : "You're all caught up! Great job! 🎉"}
            </p>
          </div>
          <div className="welcome-actions">
            <motion.button className="notif-btn-header" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <FiBell />
              <span className="notif-dot" />
            </motion.button>
            <motion.button className="generate-plan-btn" onClick={() => navigate('/planner')}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <FiZap />Generate Study Plan
            </motion.button>
          </div>
        </motion.div>

        <div className="stats-grid">
          <StatCard icon={<FiBook />} number={stats.subjects} label="Total Subjects" color="rgba(108,99,255,0.12)" delay={0.1} />
          <StatCard icon={<FiClock />} number={stats.pendingTasks} label="Pending Tasks" color="rgba(245,158,11,0.12)" delay={0.2} />
          <StatCard icon={<FiCheckSquare />} number={stats.completedTasks} label="Completed Tasks" color="rgba(52,211,153,0.12)" delay={0.3} />
          <StatCard icon="🔥" number={`${stats.streak}`} label="Day Streak" color="rgba(239,68,68,0.12)" delay={0.4} />
        </div>

        <div className="bottom-grid">
          <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="card-header">
              <h3><FiCalendar /> Today's Study Sessions</h3>
              <button className="view-all-btn" onClick={() => navigate('/planner')}>View All</button>
            </div>
            {todaySessions.length > 0 ? (
              todaySessions.map((session, i) => <SessionItem key={i} session={session} index={i} />)
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p>No study sessions for today!</p>
                <button className="empty-action-btn" onClick={() => navigate('/planner')}>Generate Study Plan</button>
              </div>
            )}
          </motion.div>

          <div className="right-column">
            <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <div className="card-header">
                <h3><FiAlertTriangle /> Deadline Warnings</h3>
              </div>
              {warnings.length > 0 ? (
                warnings.map((warning, i) => <WarningItem key={i} warning={warning} index={i} />)
              ) : (
                <div className="empty-state small"><p>✅ No urgent deadlines!</p></div>
              )}
            </motion.div>

            <motion.div className="dash-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <div className="card-header">
                <h3><FiZap /> Quick Actions</h3>
              </div>
              <div className="quick-actions-grid">
                {[
                  { icon: <FiPlus />, label: 'Add Task', color: 'purple', path: '/tasks' },
                  { icon: <FiCalendar />, label: 'Study Plan', color: 'green', path: '/planner' },
                  { icon: <FiCpu />, label: 'Ask AI', color: 'pink', path: '/ai' },
                  { icon: <FiTrendingUp />, label: 'Progress', color: 'yellow', path: '/progress' },
                ].map((action, i) => (
                  <motion.button key={i} className={`quick-action-btn ${action.color}`} onClick={() => navigate(action.path)}
                    whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                    <span className="action-icon">{action.icon}</span><span>{action.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
//JSXEOF

//echo "Dashboard updated!"