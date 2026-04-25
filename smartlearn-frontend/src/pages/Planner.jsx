// ============================================
// SmartLearn - Study Planner Page (Enhanced)
// src/pages/Planner.jsx
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar, FiClock, FiZap, FiAlertTriangle,
  FiCheckCircle, FiRefreshCw, FiTrash2, FiSun,
  FiChevronDown, FiBook, FiTarget
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { plannerAPI, tasksAPI } from '../services/api';
import './Planner.css';

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
const Planner = () => {
  const [studyPlan, setStudyPlan]       = useState(null);
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [activeTab, setActiveTab]       = useState('today'); // 'today' | 'schedule'
  const [dailyHours, setDailyHours]     = useState(() =>
    Number(localStorage.getItem('smartlearn_dailyHours')) || 4
  );
  const [maxSessionHours, setMaxSessionHours] = useState(() =>
    Number(localStorage.getItem('smartlearn_maxSession')) || 3.5
  );

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [planRes, taskRes] = await Promise.allSettled([
        plannerAPI.getPlan(),
        tasksAPI.getAll(),
      ]);
      if (planRes.status === 'fulfilled') {
        setStudyPlan(planRes.value.data);
      } else if (planRes.reason?.response?.status !== 404) {
        console.error('Error fetching plan:', planRes.reason);
      }
      if (taskRes.status === 'fulfilled') {
        setTasks(taskRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateDailyHours = (val) => {
    setDailyHours(val);
    localStorage.setItem('smartlearn_dailyHours', val);
  };

  const updateMaxSession = (val) => {
    setMaxSessionHours(val);
    localStorage.setItem('smartlearn_maxSession', val);
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      await plannerAPI.generate({
        dailyStudyHours: dailyHours,
        maxSessionHours: Number(maxSessionHours),
      });
      await fetchAll();
      setActiveTab('today');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async () => {
    if (!window.confirm('Delete your current study plan?')) return;
    try {
      await plannerAPI.deletePlan();
      setStudyPlan(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Helpers ──────────────────────────────────────────
  const todayStr = new Date().toDateString();

  const todaySessions = (studyPlan?.schedule || []).find(
    d => new Date(d.date).toDateString() === todayStr
  );

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = pendingTasks.filter(t => t.deadline && new Date(t.deadline) < new Date());
  const urgentTasks  = pendingTasks.filter(t => {
    if (!t.deadline) return false;
    const days = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="planner-loading">
          <div className="planner-spinner" />
          <p>Loading study plan...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="planner-page">

        {/* ── Header ── */}
        <div className="planner-header">
          <div>
            <h1 className="planner-title">Study Planner 📅</h1>
            <p className="planner-subtitle">AI-powered schedule based on your tasks and deadlines</p>
          </div>
          {studyPlan && (
            <div className="planner-header-actions">
              <div className="planner-hours-group">
                <button className="planner-hours-btn" onClick={() => updateDailyHours(Math.max(1, dailyHours - 0.5))}>−</button>
                <span className="planner-hours-val">{dailyHours}h/day</span>
                <button className="planner-hours-btn" onClick={() => updateDailyHours(Math.min(12, dailyHours + 0.5))}>+</button>
              </div>
              <motion.button
                className="planner-regen-btn"
                onClick={generatePlan}
                disabled={generating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiRefreshCw className={generating ? 'planner-spinning' : ''} />
                {generating ? 'Generating...' : 'Regenerate'}
              </motion.button>
              <motion.button
                className="planner-delete-btn"
                onClick={deletePlan}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <FiTrash2 /> Delete
              </motion.button>
            </div>
          )}
        </div>

        {/* ── No Plan ── */}
        {!studyPlan ? (
          <NoPlanView
            dailyHours={dailyHours}
            maxSessionHours={maxSessionHours}
            generating={generating}
            pendingTasks={pendingTasks}
            overdueTasks={overdueTasks}
            onUpdateDaily={updateDailyHours}
            onUpdateMax={updateMaxSession}
            onGenerate={generatePlan}
          />
        ) : (
          <>
            {/* ── Tabs ── */}
            <div className="planner-tabs">
              <button
                className={`planner-tab ${activeTab === 'today' ? 'active' : ''}`}
                onClick={() => setActiveTab('today')}
              >
                <FiSun /> Today's Focus
              </button>
              <button
                className={`planner-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                <FiCalendar /> Full Schedule
                <span className="planner-tab-count">{studyPlan.schedule?.length || 0} days</span>
              </button>
            </div>

            {/* ── Warnings ── */}
            {studyPlan.warnings?.length > 0 && (
              <motion.div className="planner-warnings" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 className="planner-warnings-title"><FiAlertTriangle /> Deadline Warnings</h3>
                <div className="planner-warnings-list">
                  {studyPlan.warnings.map((w, i) => (
                    <div key={i} className={`planner-warning-item ${w.type === 'overdue' ? 'overdue' : 'urgent'}`}>
                      <span>{w.type === 'overdue' ? '🚨' : '⚠️'}</span>
                      <div>
                        <div className="planner-warning-text">{w.taskTitle}</div>
                        <div className="planner-warning-sub">{w.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'today' ? (
                <TodayView
                  key="today"
                  todaySessions={todaySessions}
                  pendingTasks={pendingTasks}
                  overdueTasks={overdueTasks}
                  urgentTasks={urgentTasks}
                  studyPlan={studyPlan}
                />
              ) : (
                <ScheduleView
                  key="schedule"
                  studyPlan={studyPlan}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// ══════════════════════════════════════════════════════
// NO PLAN VIEW
// ══════════════════════════════════════════════════════
const NoPlanView = ({
  dailyHours, maxSessionHours, generating,
  pendingTasks, overdueTasks,
  onUpdateDaily, onUpdateMax, onGenerate
}) => (
  <motion.div
    className="planner-no-plan"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    {/* Task Summary */}
    {pendingTasks.length > 0 && (
      <div className="planner-task-summary">
        <div className="planner-summary-stat">
          <span className="planner-summary-num">{pendingTasks.length}</span>
          <span className="planner-summary-label">Pending Tasks</span>
        </div>
        <div className="planner-summary-divider" />
        <div className="planner-summary-stat">
          <span className="planner-summary-num" style={{ color: '#EF4444' }}>{overdueTasks.length}</span>
          <span className="planner-summary-label">Overdue</span>
        </div>
        <div className="planner-summary-divider" />
        <div className="planner-summary-stat">
          <span className="planner-summary-num" style={{ color: '#F59E0B' }}>
            {pendingTasks.length - overdueTasks.length}
          </span>
          <span className="planner-summary-label">Upcoming</span>
        </div>
      </div>
    )}

    <div className="planner-generate-card">
      <div className="planner-generate-icon">📚</div>
      <h2>Generate Your Study Plan</h2>
      <p>Let AI create a personalized schedule based on your {pendingTasks.length} pending tasks and deadlines.</p>

      {/* Daily Hours */}
      <div className="planner-hours-selector">
        <label>Daily Study Hours</label>
        <div className="planner-hours-input-group">
          <button className="planner-hours-btn" onClick={() => onUpdateDaily(Math.max(1, dailyHours - 0.5))}>−</button>
          <input
            type="number"
            value={dailyHours}
            onChange={e => onUpdateDaily(Math.max(1, Number(e.target.value)))}
            min="1" max="12" step="0.5"
          />
          <button className="planner-hours-btn" onClick={() => onUpdateDaily(Math.min(12, dailyHours + 0.5))}>+</button>
        </div>
        <span className="planner-hours-label">{dailyHours} hours per day</span>
      </div>

      {/* Max Session */}
      <div className="planner-hours-selector">
        <label>Max Hours Per Task Per Day</label>
        <div className="planner-hours-input-group">
          <button className="planner-hours-btn" onClick={() => onUpdateMax(Math.max(0.5, maxSessionHours - 0.5))}>−</button>
          <input
            type="number"
            value={maxSessionHours}
            onChange={e => onUpdateMax(Math.max(0.5, Number(e.target.value)))}
            min="0.5" max="8" step="0.5"
          />
          <button className="planner-hours-btn" onClick={() => onUpdateMax(Math.min(8, maxSessionHours + 0.5))}>+</button>
        </div>
        <span className="planner-hours-label">{maxSessionHours}h max per task per day</span>
      </div>

      <motion.button
        className="planner-generate-btn"
        onClick={onGenerate}
        disabled={generating}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <FiZap />
        {generating ? 'Generating Plan...' : 'Generate Study Plan'}
      </motion.button>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════
// TODAY VIEW
// ══════════════════════════════════════════════════════
const TodayView = ({ todaySessions, pendingTasks, overdueTasks, urgentTasks, studyPlan }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      className="planner-today"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      {/* Today Header */}
      <div className="today-header-card">
        <div className="today-header-left">
          <FiSun className="today-sun-icon" />
          <div>
            <h2 className="today-date">{today}</h2>
            <p className="today-sub">
              {todaySessions
                ? `${todaySessions.sessions?.length || 0} study sessions · ${todaySessions.totalHours}h planned`
                : 'No study sessions scheduled for today'}
            </p>
          </div>
        </div>
        {todaySessions && (
          <div className="today-hours-badge">
            <FiClock /> {todaySessions.totalHours}h today
          </div>
        )}
      </div>

      <div className="today-two-col">

        {/* Today's Sessions */}
        <div className="today-section">
          <h3 className="today-section-title"><FiBook /> Today's Study Sessions</h3>
          {!todaySessions || todaySessions.sessions?.length === 0 ? (
            <div className="today-empty">
              <p>🎉 No sessions today!</p>
              <p className="today-empty-sub">Enjoy your break or check tomorrow's schedule.</p>
            </div>
          ) : (
            <div className="today-sessions-list">
              {todaySessions.sessions.map((session, i) => (
                <motion.div
                  key={i}
                  className="today-session-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className="today-session-bar" style={{ background: session.subject?.color || '#6C63FF' }} />
                  <div className="today-session-info">
                    <p className="today-session-title">{session.title}</p>
                    <p className="today-session-subject">{session.subject?.name || 'General'}</p>
                  </div>
                  <div className="today-session-duration">{session.hoursToStudy}h</div>
                </motion.div>
              ))}
              {todaySessions.breakMessage && (
                <div className="today-break-msg">{todaySessions.breakMessage}</div>
              )}
            </div>
          )}
        </div>

        {/* Tasks needing attention */}
        <div className="today-section">
          <h3 className="today-section-title"><FiTarget /> Tasks Needing Attention</h3>
          {overdueTasks.length === 0 && urgentTasks.length === 0 ? (
            <div className="today-empty">
              <p>✅ All caught up!</p>
              <p className="today-empty-sub">No overdue or urgent tasks right now.</p>
            </div>
          ) : (
            <div className="today-tasks-list">
              {overdueTasks.map((task, i) => (
                <div key={task._id} className="today-task-item overdue">
                  <div>
                    <p className="today-task-title">{task.title}</p>
                    <p className="today-task-meta">
                      🚨 {Math.abs(Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)))}d overdue
                      {task.subject?.name && ` · ${task.subject.name}`}
                    </p>
                  </div>
                  <span className={`today-priority priority-${task.priority}`}>{task.priority}</span>
                </div>
              ))}
              {urgentTasks.map((task, i) => {
                const days = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task._id} className="today-task-item urgent">
                    <div>
                      <p className="today-task-title">{task.title}</p>
                      <p className="today-task-meta">
                        {days === 0 ? '🔥 Due today' : days === 1 ? '⏰ Due tomorrow' : `⚠️ ${days}d left`}
                        {task.subject?.name && ` · ${task.subject.name}`}
                      </p>
                    </div>
                    <span className={`today-priority priority-${task.priority}`}>{task.priority}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Plan Summary */}
      <div className="today-plan-summary">
        <div className="today-summary-item">
          <span className="today-summary-num">{studyPlan.schedule?.length || 0}</span>
          <span className="today-summary-label">Days Planned</span>
        </div>
        <div className="today-summary-item">
          <span className="today-summary-num">{studyPlan.dailyStudyHours}h</span>
          <span className="today-summary-label">Per Day</span>
        </div>
        <div className="today-summary-item">
          <span className="today-summary-num">
            {(studyPlan.schedule || []).reduce((acc, d) => acc + (d.sessions?.length || 0), 0)}
          </span>
          <span className="today-summary-label">Total Sessions</span>
        </div>
        <div className="today-summary-item">
          <span className="today-summary-num" style={{ color: '#EF4444' }}>{studyPlan.warnings?.length || 0}</span>
          <span className="today-summary-label">Warnings</span>
        </div>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
// SCHEDULE VIEW
// ══════════════════════════════════════════════════════
const ScheduleView = ({ studyPlan }) => {
  const todayStr = new Date().toDateString();

  return (
    <motion.div
      className="planner-schedule"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
    >
      <div className="schedule-top">
        <h3 className="schedule-view-title"><FiCalendar /> Full Study Schedule</h3>
        <div className="schedule-meta">
          <span><FiClock /> {studyPlan.dailyStudyHours}h/day</span>
          <span>📅 {studyPlan.schedule?.length || 0} days</span>
        </div>
      </div>

      <div className="schedule-list">
        {(studyPlan.schedule || []).map((day, i) => (
          <DayCard
            key={i}
            day={day}
            index={i}
            isToday={new Date(day.date).toDateString() === todayStr}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
// DAY CARD
// ══════════════════════════════════════════════════════
const DayCard = ({ day, index, isToday }) => {
  const [expanded, setExpanded] = useState(isToday);

  return (
    <motion.div
      className={`planner-day-card ${isToday ? 'today' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div className="planner-day-header" onClick={() => setExpanded(!expanded)}>
        <div className="planner-day-left">
          {isToday && <span className="today-pill">Today</span>}
          <span className="planner-day-date">
            {new Date(day.date).toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric'
            })}
          </span>
          <span className="planner-day-hours-badge">
            <FiClock size={11} /> {day.totalHours}h
          </span>
          <span className="planner-day-sessions-count">
            {day.sessions?.length || 0} sessions
          </span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown size={16} color="#9CA3AF" />
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="planner-day-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {day.sessions?.map((session, i) => (
              <div key={i} className="planner-session-item">
                <div className="planner-session-bar" style={{ background: session.subject?.color || '#6C63FF' }} />
                <div className="planner-session-details">
                  <p className="planner-session-title">{session.title}</p>
                  <p className="planner-session-subject">{session.subject?.name || 'General'}</p>
                </div>
                <div className="planner-session-dur">{session.hoursToStudy}h</div>
              </div>
            ))}
            {day.breakMessage && (
              <div className="planner-break-msg">{day.breakMessage}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Planner;