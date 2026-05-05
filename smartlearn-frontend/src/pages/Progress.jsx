// ============================================
// SmartLearn - Progress Page (Enhanced)
// src/pages/Progress.jsx
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  FiCheckCircle, FiClock, FiAlertCircle, FiTrendingUp,
  FiBookOpen, FiActivity, FiCalendar, FiAward, FiZap, FiList
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import './Progress.css';
import api from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────
const timeAgo = (date) => {
  if (!date) return '';
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Custom Tooltip for Bar/Area Charts ───────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="prog-custom-tooltip">
        <p className="prog-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="prog-custom-tooltip">
        <p className="prog-tooltip-label">{label}</p>
        <p style={{ color: '#6C63FF' }}>
          Completed: <strong>{payload[0].value}</strong>
        </p>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────
const Progress = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('api/progress/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError('Failed to load progress data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="prog-loading">
          <div className="prog-spinner" />
          <p>Loading your progress...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="prog-loading">
          <p style={{ color: '#EF4444' }}>{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  const { overview, dailyCompletions, tasksBySubject, priorityBreakdown, recentActivity, upcomingDeadlines } = stats;

  // Pie chart data
  const pieData = [
    { name: 'Completed',   value: overview.completedTasks,  color: '#10B981' },
    { name: 'In Progress', value: overview.inProgressTasks, color: '#6C63FF' },
    { name: 'Pending',     value: overview.pendingTasks,    color: '#F59E0B' },
  ].filter(d => d.value > 0);

  // Priority chart data
  const priorityData = [
    { name: 'High',   value: priorityBreakdown.high,   color: '#EF4444' },
    { name: 'Medium', value: priorityBreakdown.medium, color: '#F59E0B' },
    { name: 'Low',    value: priorityBreakdown.low,    color: '#10B981' },
  ];

  // Stat cards — now 5 including Total Tasks and Streak
  const statCards = [
    {
      icon: <FiList />,
      label: 'Total Tasks',
      value: overview.totalTasks,
      sub: 'All time',
      color: '#6C63FF',
    },
    {
      icon: <FiCheckCircle />,
      label: 'Completed',
      value: overview.completedTasks,
      sub: `${overview.completionRate}% completion rate`,
      color: '#10B981',
    },
    {
      icon: <FiClock />,
      label: 'Study Hours',
      value: `${overview.totalStudyHours}h`,
      sub: 'From completed tasks',
      color: '#3B82F6',
    },
    {
      icon: <FiZap />,
      label: 'Day Streak',
      value: overview.streak,
      sub: overview.streak > 0 ? 'Keep it up! 🔥' : 'Complete a task today!',
      color: '#F59E0B',
    },
    {
      icon: <FiAlertCircle />,
      label: 'Overdue',
      value: overview.overdueTasks,
      sub: overview.overdueTasks > 0 ? 'Need attention ⚠️' : 'All on track ✅',
      color: overview.overdueTasks > 0 ? '#EF4444' : '#10B981',
    },
  ];

  return (
    <DashboardLayout>
      <div className="progress-page">

        {/* ── Header ── */}
        <div className="prog-header">
          <div>
            <h1 className="prog-title">Progress 📊</h1>
            <p className="prog-subtitle">Track your study performance and achievements</p>
          </div>
        </div>

        {/* ── Stat Cards (5) ── */}
        <div className="prog-stats-grid">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              className="prog-stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{ '--accent': card.color }}
            >
              <div className="prog-stat-icon" style={{ color: card.color, background: card.color + '15' }}>
                {card.icon}
              </div>
              <div className="prog-stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="prog-stat-label">{card.label}</div>
              <div className="prog-stat-sub">{card.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── 14-Day Trend Chart (full width) ── */}
        <motion.div
          className="prog-chart-card prog-full-width"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="prog-chart-header">
            <FiTrendingUp />
            <h3>14-Day Completion Trend</h3>
          </div>
          {dailyCompletions.every(d => d.completed === 0) ? (
            <div className="prog-chart-empty">Complete some tasks to see your trend! 💪</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyCompletions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6C63FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#6C63FF"
                  strokeWidth={2.5}
                  fill="url(#trendGrad)"
                  dot={{ fill: '#6C63FF', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#6C63FF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* ── Charts Row — Subject Bar + Pie ── */}
        <div className="prog-charts-row">

          {/* Tasks by Subject */}
          <motion.div
            className="prog-chart-card prog-wide"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="prog-chart-header">
              <FiBookOpen />
              <h3>Tasks by Subject</h3>
            </div>
            {tasksBySubject.length === 0 ? (
              <div className="prog-chart-empty">No subjects yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={tasksBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(108,99,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
                  <Bar dataKey="completed"  name="Completed"   fill="#10B981" radius={[4,4,0,0]} />
                  <Bar dataKey="inProgress" name="In Progress" fill="#6C63FF" radius={[4,4,0,0]} />
                  <Bar dataKey="pending"    name="Pending"     fill="#F59E0B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Task Status Pie */}
          <motion.div
            className="prog-chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="prog-chart-header">
              <FiActivity />
              <h3>Task Status</h3>
            </div>
            {pieData.length === 0 ? (
              <div className="prog-chart-empty">No tasks yet</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid rgba(108,99,255,0.15)',
                        borderRadius: '10px',
                        color: '#1E1B4B',
                        fontSize: '0.82rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="prog-pie-legend">
                  {pieData.map((d, i) => (
                    <div key={i} className="prog-pie-item">
                      <span className="prog-pie-dot" style={{ background: d.color }} />
                      <span>{d.name}</span>
                      <span className="prog-pie-count">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="prog-bottom-row">

          {/* Recently Completed */}
          <motion.div
            className="prog-activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="prog-chart-header">
              <FiAward />
              <h3>Recently Completed</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div className="prog-chart-empty">No completed tasks yet — keep going! 💪</div>
            ) : (
              <div className="prog-activity-list">
                {recentActivity.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="prog-activity-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                  >
                    <div className="prog-color-bar" style={{ background: item.subjectColor }} />
                    <div className="prog-activity-details">
                      <div className="prog-activity-title">{item.title}</div>
                      <div className="prog-activity-meta">{item.subjectName} · {item.estimatedHours}h</div>
                    </div>
                    <div className="prog-activity-time">{timeAgo(item.completedAt)}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div
            className="prog-activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="prog-chart-header">
              <FiCalendar />
              <h3>Upcoming Deadlines</h3>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div className="prog-chart-empty">No upcoming deadlines 🎉</div>
            ) : (
              <div className="prog-activity-list">
                {upcomingDeadlines.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="prog-activity-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.06 }}
                  >
                    <div className="prog-color-bar" style={{ background: item.subjectColor }} />
                    <div className="prog-activity-details">
                      <div className="prog-activity-title">{item.title}</div>
                      <div className="prog-activity-meta">{item.subjectName}</div>
                    </div>
                    <div className={`prog-deadline-badge ${item.daysLeft <= 2 ? 'urgent' : item.daysLeft <= 5 ? 'soon' : 'safe'}`}>
                      {item.daysLeft === 0 ? 'Today' : item.daysLeft === 1 ? 'Tomorrow' : `${item.daysLeft}d`}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Priority Breakdown + Completion Circle */}
          <motion.div
            className="prog-activity-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <div className="prog-chart-header">
              <FiActivity />
              <h3>Priority Breakdown</h3>
            </div>
            <div className="prog-priority-list">
              {priorityData.map((p, i) => {
                const pct = overview.totalTasks > 0
                  ? Math.round((p.value / overview.totalTasks) * 100)
                  : 0;
                return (
                  <div key={i} className="prog-priority-row">
                    <div className="prog-priority-label">
                      <span className="prog-priority-dot" style={{ background: p.color }} />
                      {p.name}
                    </div>
                    <div className="prog-priority-bar-bg">
                      <motion.div
                        className="prog-priority-bar-fill"
                        style={{ background: p.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.55 + i * 0.1 }}
                      />
                    </div>
                    <span className="prog-priority-count">{p.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Completion Rate Circle */}
            <div className="prog-rate-wrap">
              <div className="prog-rate-circle">
                <svg viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(108,99,255,0.12)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none"
                    stroke="#6C63FF"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - overview.completionRate / 100)}`}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="prog-rate-text">
                  <span className="prog-rate-number">{overview.completionRate}%</span>
                  <span className="prog-rate-label">done</span>
                </div>
              </div>
              <div className="prog-rate-desc">Overall completion rate</div>
            </div>
          </motion.div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;