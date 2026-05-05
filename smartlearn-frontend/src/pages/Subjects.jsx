// ============================================
// SmartLearn - Subjects Page (Enhanced)
// src/pages/Subjects.jsx
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiBook,
  FiCheckCircle, FiClock, FiAlertCircle,
  FiFileText, FiAward, FiChevronRight, FiArrowLeft
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { subjectsAPI, tasksAPI } from '../services/api';
import axios from 'axios';
import './Subjects.css';

const API = import.meta.env.VITE_API_URL +'/api';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'x-auth-token': getToken() });

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316',
  '#84CC16', '#6C63FF', '#F472B6', '#34D399', '#A78BFA'
];

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
const Subjects = () => {
  const [subjects, setSubjects]             = useState([]);
  const [tasks, setTasks]                   = useState([]);
  const [modules, setModules]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showModal, setShowModal]           = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData]             = useState({ name: '', color: '#6C63FF', description: '' });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [subRes, taskRes, modRes] = await Promise.all([
        subjectsAPI.getAll(),
        tasksAPI.getAll(),
        axios.get(`${API}/modules`, { headers: authHeaders() }),
      ]);
      setSubjects(subRes.data);
      setTasks(taskRes.data);
      setModules(modRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────
  const getSubjectTasks = (id) =>
    tasks.filter(t => t.subject?._id === id || t.subject === id);

  const getSubjectModules = (id) =>
    modules.filter(m => m.subject?._id === id || m.subject === id);

  const getSubjectStats = (id) => {
    const subTasks   = getSubjectTasks(id);
    const subModules = getSubjectModules(id);
    const completed  = subTasks.filter(t => t.status === 'completed').length;
    const overdue    = subTasks.filter(t => {
      if (!t.deadline || t.status === 'completed') return false;
      return new Date(t.deadline) < new Date();
    }).length;
    const upcoming   = subTasks.filter(t => {
      if (!t.deadline || t.status === 'completed') return false;
      const days = Math.ceil((new Date(t.deadline) - new Date()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 3;
    }).length;
    const progress = subTasks.length === 0 ? 0 : Math.round((completed / subTasks.length) * 100);
    return { subTasks, subModules, completed, overdue, upcoming, progress };
  };

  // ── CRUD ─────────────────────────────────────────────
  const openModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({ name: subject.name, color: subject.color, description: subject.description || '' });
    } else {
      setEditingSubject(null);
      setFormData({ name: '', color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)], description: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectsAPI.update(editingSubject._id, formData);
      } else {
        await subjectsAPI.create(formData);
      }
      await fetchAll();
      setShowModal(false);
      setEditingSubject(null);
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject? All related tasks will be affected.')) return;
    try {
      await subjectsAPI.delete(id);
      setSelectedSubject(null);
      await fetchAll();
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="sub-loading-container">
          <div className="sub-loading-spinner" />
          <p>Loading subjects...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ── Dashboard View ────────────────────────────────────
  if (selectedSubject) {
    const stats = getSubjectStats(selectedSubject._id);
    return (
      <DashboardLayout>
        <SubjectDashboard
          subject={selectedSubject}
          stats={stats}
          onBack={() => setSelectedSubject(null)}
          onEdit={() => openModal(selectedSubject)}
          onDelete={() => handleDelete(selectedSubject._id)}
        />
        <AnimatePresence>
          {showModal && (
            <SubjectModal
              editingSubject={editingSubject}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onClose={() => { setShowModal(false); setEditingSubject(null); }}
              presetColors={PRESET_COLORS}
            />
          )}
        </AnimatePresence>
      </DashboardLayout>
    );
  }

  // ── Grid View ─────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="subjects-page">

        <div className="subjects-page-header">
          <div>
            <h1 className="subjects-page-title">Subjects 📚</h1>
            <p className="subjects-page-subtitle">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} · Click any subject to view details
            </p>
          </div>
          <motion.button
            className="subjects-add-btn"
            onClick={() => openModal()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiPlus /> Add Subject
          </motion.button>
        </div>

        {subjects.length > 0 ? (
          <div className="subjects-grid">
            {subjects.map((subject, i) => {
              const stats = getSubjectStats(subject._id);
              return (
                <SubjectCard
                  key={subject._id}
                  subject={subject}
                  index={i}
                  stats={stats}
                  onView={() => setSelectedSubject(subject)}
                  onEdit={() => openModal(subject)}
                  onDelete={() => handleDelete(subject._id)}
                />
              );
            })}
          </div>
        ) : (
          <div className="sub-empty-state">
            <div className="sub-empty-icon">📚</div>
            <h3>No subjects yet</h3>
            <p>Create your first subject to get started!</p>
            <button className="sub-empty-action-btn" onClick={() => openModal()}>
              <FiPlus /> Add Subject
            </button>
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <SubjectModal
              editingSubject={editingSubject}
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              onClose={() => { setShowModal(false); setEditingSubject(null); }}
              presetColors={PRESET_COLORS}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

// ══════════════════════════════════════════════════════
// SUBJECT CARD
// ══════════════════════════════════════════════════════
const SubjectCard = ({ subject, index, stats, onView, onEdit, onDelete }) => (
  <motion.div
    className="subject-card"
    style={{ '--card-color': subject.color }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -6, boxShadow: `0 16px 40px ${subject.color}30` }}
  >
    <div className="subject-color-header" style={{ background: subject.color }}>
      <div className="subject-icon"><FiBook /></div>
      {stats.overdue > 0 && (
        <div className="sub-overdue-badge">⚠️ {stats.overdue} overdue</div>
      )}
    </div>

    <div className="subject-content">
      <h3 className="subject-name">{subject.name}</h3>
      {subject.description && <p className="subject-desc">{subject.description}</p>}

      <div className="sub-progress-wrap">
        <div className="sub-progress-top">
          <span className="sub-progress-label">Task Progress</span>
          <span className="sub-progress-pct" style={{ color: subject.color }}>{stats.progress}%</span>
        </div>
        <div className="sub-progress-bar">
          <div className="sub-progress-fill" style={{ width: `${stats.progress}%`, background: subject.color }} />
        </div>
      </div>

      <div className="sub-stats-row">
        <span><FiFileText size={11} /> {stats.subTasks.length} tasks</span>
        <span><FiAward size={11} /> {stats.subModules.length} modules</span>
        <span><FiCheckCircle size={11} /> {stats.completed} done</span>
      </div>
    </div>

    <div className="subject-actions">
      <button
        className="subject-view-btn"
        style={{ background: subject.color + '15', color: subject.color, border: `1px solid ${subject.color}30` }}
        onClick={onView}
      >
        View Details <FiChevronRight size={14} />
      </button>
      <motion.button className="subject-btn edit-btn" onClick={onEdit} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <FiEdit2 />
      </motion.button>
      <motion.button className="subject-btn delete-btn" onClick={onDelete} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <FiTrash2 />
      </motion.button>
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════
// SUBJECT DASHBOARD
// ══════════════════════════════════════════════════════
const SubjectDashboard = ({ subject, stats, onBack, onEdit, onDelete }) => {
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  };

  return (
    <motion.div className="subject-dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

      {/* Header */}
      <div className="sub-dash-header">
        <div className="sub-dash-header-left">
          <button className="sub-back-btn" onClick={onBack}>
            <FiArrowLeft /> Back to Subjects
          </button>
          <div className="sub-dash-title-row">
            <div className="sub-color-dot" style={{ background: subject.color }} />
            <h1 className="subjects-page-title">{subject.name}</h1>
          </div>
          {subject.description && <p className="subjects-page-subtitle">{subject.description}</p>}
        </div>
        <div className="sub-dash-actions">
          <button className="sub-btn-edit" onClick={onEdit}><FiEdit2 /> Edit</button>
          <button className="sub-btn-delete" onClick={onDelete}><FiTrash2 /> Delete</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="sub-stats-grid">
        {[
          { icon: <FiFileText />, num: stats.subTasks.length,   label: 'Total Tasks',  bg: subject.color + '15', color: subject.color },
          { icon: <FiCheckCircle />, num: stats.completed,      label: 'Completed',    bg: '#10B98115', color: '#10B981' },
          { icon: <FiAlertCircle />, num: stats.overdue,        label: 'Overdue',      bg: '#EF444415', color: '#EF4444' },
          { icon: <FiClock />,       num: stats.upcoming,       label: 'Due Soon',     bg: '#F59E0B15', color: '#F59E0B' },
          { icon: <FiAward />,       num: stats.subModules.length, label: 'Modules',   bg: '#8B5CF615', color: '#8B5CF6' },
        ].map((s, i) => (
          <div key={i} className="sub-stat-card">
            <div className="sub-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <div className="sub-stat-number">{s.num}</div>
              <div className="sub-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      <div className="sub-overall-progress" style={{ borderColor: subject.color + '30' }}>
        <div className="sub-overall-top">
          <span className="sub-overall-title">Overall Progress</span>
          <span className="sub-overall-pct" style={{ color: subject.color }}>{stats.progress}%</span>
        </div>
        <div className="sub-overall-bar">
          <div className="sub-overall-fill" style={{ width: `${stats.progress}%`, background: `linear-gradient(90deg, ${subject.color}, ${subject.color}99)` }} />
        </div>
        <p className="sub-overall-sub">{stats.completed} of {stats.subTasks.length} tasks completed</p>
      </div>

      {/* Two column */}
      <div className="sub-two-col">

        {/* Tasks */}
        <div className="sub-section-card">
          <h2 className="sub-section-title">
            <FiFileText style={{ color: subject.color }} /> Tasks
            <span className="sub-section-badge" style={{ background: subject.color + '15', color: subject.color }}>
              {stats.subTasks.length}
            </span>
          </h2>
          {stats.subTasks.length === 0 ? (
            <div className="sub-section-empty">
              <p>No tasks linked to this subject yet.</p>
              <p className="sub-section-empty-hint">Create a task and select "{subject.name}" as the subject.</p>
            </div>
          ) : (
            <div className="sub-tasks-list">
              {stats.subTasks.map(task => {
                const days = getDaysRemaining(task.deadline);
                const isOverdue = days !== null && days < 0 && task.status !== 'completed';
                const isUrgent  = days !== null && days <= 2 && days >= 0 && task.status !== 'completed';
                return (
                  <div key={task._id} className={`sub-task-item ${task.status === 'completed' ? 'completed' : isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
                    <div className="sub-task-left">
                      <div className={`sub-task-dot ${task.status === 'completed' ? 'done' : isOverdue ? 'red' : isUrgent ? 'yellow' : 'blue'}`} />
                      <div>
                        <p className="sub-task-title">{task.title}</p>
                        {task.deadline && (
                          <p className="sub-task-deadline">
                            {task.status === 'completed' ? '✅ Completed' :
                              isOverdue ? `⚠️ ${Math.abs(days)}d overdue` :
                              days === 0 ? '🔥 Due today' :
                              days === 1 ? '⏰ Due tomorrow' :
                              `📅 ${days}d left`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`sub-priority-pill priority-${task.priority}`}>{task.priority}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="sub-section-card">
          <h2 className="sub-section-title">
            <FiAward style={{ color: subject.color }} /> Learning Modules
            <span className="sub-section-badge" style={{ background: subject.color + '15', color: subject.color }}>
              {stats.subModules.length}
            </span>
          </h2>
          {stats.subModules.length === 0 ? (
            <div className="sub-section-empty">
              <p>No modules linked to this subject yet.</p>
              <p className="sub-section-empty-hint">Create a module and select "{subject.name}" as the subject.</p>
            </div>
          ) : (
            <div className="sub-modules-list">
              {stats.subModules.map(mod => {
                const total = mod.chapters?.length || 0;
                const done  = mod.myProgress?.chaptersCompleted || 0;
                const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <div key={mod._id} className="sub-module-item">
                    <div className="sub-module-header">
                      <p className="sub-module-title">{mod.title}</p>
                      {mod.myProgress?.quizPassed && <span className="sub-quiz-passed">🏆 Passed</span>}
                    </div>
                    <div className="sub-module-bar">
                      <div className="sub-module-fill" style={{ width: `${pct}%`, background: subject.color }} />
                    </div>
                    <p className="sub-module-sub">{done}/{total} chapters · {pct}%</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
// SUBJECT MODAL
// ══════════════════════════════════════════════════════
const SubjectModal = ({ editingSubject, formData, setFormData, onSubmit, onClose, presetColors }) => (
  <motion.div
    className="sub-modal-overlay"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="sub-modal-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={e => e.stopPropagation()}
    >
      <div className="sub-modal-header">
        <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
        <button className="sub-modal-close" onClick={onClose}><FiX /></button>
      </div>

      <form onSubmit={onSubmit} className="sub-modal-form">
        <div className="sub-form-group">
          <label>Subject Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Mathematics, Physics, Chemistry"
            required
          />
        </div>

        <div className="sub-form-group">
          <label>Description <span className="sub-optional">(Optional)</span></label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this subject..."
            rows="3"
          />
        </div>

        <div className="sub-form-group">
          <label>Color Theme</label>
          <div className="sub-color-picker">
            {presetColors.map(color => (
              <motion.div
                key={color}
                className={`sub-color-option ${formData.color === color ? 'selected' : ''}`}
                style={{ background: color }}
                onClick={() => setFormData({ ...formData, color })}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              >
                {formData.color === color && <span className="sub-check-mark">✓</span>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="sub-preview-box">
          <div className="sub-preview-label">Preview</div>
          <div className="sub-preview-card" style={{ borderColor: formData.color }}>
            <div className="sub-preview-header" style={{ background: formData.color }}>
              <FiBook />
            </div>
            <div className="sub-preview-name">{formData.name || 'Subject Name'}</div>
          </div>
        </div>

        <div className="sub-modal-actions">
          <button type="button" className="sub-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="sub-btn-submit">
            {editingSubject ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

export default Subjects;