// ============================================
// SmartLearn - Tasks Page
// src/pages/Tasks.jsx
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiCalendar, FiClock,
  FiAlertCircle, FiCheckCircle, FiFilter, FiSearch
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { tasksAPI, subjectsAPI } from '../services/api';
import './Tasks.css';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    deadline: '',
    estimatedHours: '',
    priority: 'medium',
  });

  // Fetch tasks and subjects
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, subjectsRes] = await Promise.all([
        tasksAPI.getAll(),
        subjectsAPI.getAll()
      ]);
      setTasks(tasksRes.data);
      setSubjects(subjectsRes.data);
      setFilteredTasks(tasksRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  useEffect(() => {
    let filtered = [...tasks];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filterStatus, filterPriority]);

  // Open modal
  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        subject: task.subject._id,
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours,
        priority: task.priority,
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        subject: '',
        deadline: '',
        estimatedHours: '',
        priority: 'medium',
      });
    }
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await tasksAPI.update(editingTask._id, formData);
      } else {
        await tasksAPI.create(formData);
      }
      await fetchData();
      closeModal();
    } catch (err) {
      console.error('Error saving task:', err);
      alert(err.response?.data?.msg || 'Failed to save task');
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksAPI.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Mark complete
  const handleComplete = async (id) => {
    try {
      await tasksAPI.complete(id);
      await fetchData();
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  // Get days remaining
  const getDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="loading-spinner-large" />
          <p>Loading tasks...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="tasks-page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Tasks 📝</h1>
            <p className="page-subtitle">Manage your assignments and study tasks !</p>
          </div>
          <motion.button
            className="add-btn"
            onClick={() => openModal()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <FiPlus /> Add Task
          </motion.button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <FiFilter />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length > 0 ? (
          <div className="tasks-grid">
            {filteredTasks.map((task, i) => (
              <TaskCard
                key={task._id}
                task={task}
                index={i}
                onEdit={() => openModal(task)}
                onDelete={() => handleDelete(task._id)}
                onComplete={() => handleComplete(task._id)}
                getDaysRemaining={getDaysRemaining}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state-page">
            <div className="empty-icon">📋</div>
            <h3>No tasks found</h3>
            <p>Create your first task to get started!</p>
            <button className="empty-action-btn" onClick={() => openModal()}>
              <FiPlus /> Add Task
            </button>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <TaskModal
              editingTask={editingTask}
              formData={formData}
              setFormData={setFormData}
              subjects={subjects}
              onSubmit={handleSubmit}
              onClose={closeModal}
            />
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

// ---- Task Card Component ----
const TaskCard = ({ task, index, onEdit, onDelete, onComplete, getDaysRemaining }) => {
  const daysRemaining = getDaysRemaining(task.deadline);
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isUrgent = daysRemaining !== null && daysRemaining <= 2 && daysRemaining >= 0;

  return (
    <motion.div
      className={`task-card ${task.status}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div className="task-card-header">
        <div
          className="task-color-bar"
          style={{ background: task.subject?.color || '#6C63FF' }}
        />
        <div className={`priority-badge priority-${task.priority}`}>
          {task.priority}
        </div>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-meta">
        <div className="task-subject">
          <FiAlertCircle />
          {task.subject?.name || 'No subject'}
        </div>
        {task.deadline && (
          <div className={`task-deadline ${isOverdue ? 'overdue' : isUrgent ? 'urgent' : ''}`}>
            <FiCalendar />
            {isOverdue
              ? `${Math.abs(daysRemaining)}d overdue`
              : daysRemaining === 0
              ? 'Due today'
              : daysRemaining === 1
              ? 'Due tomorrow'
              : `${daysRemaining}d left`}
          </div>
        )}
      </div>

      <div className="task-hours">
        <FiClock /> {task.estimatedHours}h estimated
      </div>

      <div className="task-actions">
        {task.status !== 'completed' && (
          <button className="task-btn complete-btn" onClick={onComplete}>
            <FiCheckCircle /> Complete
          </button>
        )}
        <button className="task-btn edit-btn" onClick={onEdit}>
          <FiEdit2 />
        </button>
        <button className="task-btn delete-btn" onClick={onDelete}>
          <FiTrash2 />
        </button>
      </div>

      {task.status === 'completed' && (
        <div className="completed-badge">
          <FiCheckCircle /> Completed
        </div>
      )}
    </motion.div>
  );
};

// ---- Task Modal Component ----
const TaskModal = ({ editingTask, formData, setFormData, subjects, onSubmit, onClose }) => {
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{editingTask ? 'Edit Task' : 'Add New Task'}</h2>
          <button className="modal-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <form onSubmit={onSubmit} className="modal-form">
          <div className="form-group">
            <label>Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Complete Chapter 5"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details about this task..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Subject</label>
              <select name="subject" value={formData.subject} onChange={handleChange} required>
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Estimated Hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                placeholder="e.g., 3"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Tasks;