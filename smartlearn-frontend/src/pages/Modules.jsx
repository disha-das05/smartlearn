// ============================================
// SmartLearn - Learning Modules Page
// src/pages/Modules.jsx
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSearch,
  FiBook, FiCheckCircle, FiFileText, FiAward,
  FiGlobe, FiLock,
  FiPlay, FiArrowRight, FiArrowLeft
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { subjectsAPI } from '../services/api';
import axios from 'axios';
import './Modules.css';

const API = import.meta.env.VITE_API_URL/api;
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ 'x-auth-token': getToken() });

// ── Helpers ────────────────────────────────────────────
const getProgress = (mod) => {
  const total = mod.chapters?.length || 0;
  const done = mod.myProgress?.chaptersCompleted || 0;
  return total === 0 ? 0 : Math.round((done / total) * 100);
};

// ── Save chapter progress to backend ──────────────────
const saveChapterProgress = async (moduleId, chapterIndex) => {
  try {
    await axios.post(
      `${API}/modules/${moduleId}/progress`,
      { chapterIndex },
      { headers: authHeaders() }
    );
  } catch (err) {
    console.error('Failed to save chapter progress:', err);
  }
};

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
const Modules = () => {
  const [modules, setModules]             = useState([]);
  const [subjects, setSubjects]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setActiveSection] = useState('official');
  const [searchQuery, setSearchQuery]     = useState('');

  // Modals
  const [viewMod, setViewMod]           = useState(null);
  const [quizMod, setQuizMod]           = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote]   = useState(null);

  // Note form
  const [noteForm, setNoteForm] = useState({
    title: '', description: '', subject: '', isPublic: false,
    chapters: [{ title: '', content: '', fileUrl: '', order: 0 }],
    quiz: [],
  });
  const [activeTab, setActiveTab]   = useState('info');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modRes, subRes] = await Promise.all([
        axios.get(`${API}/modules`, { headers: authHeaders() }),
        subjectsAPI.getAll(),
      ]);
      setModules(modRes.data);
      setSubjects(subRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const officialModules = modules.filter(m => m.isPublic);
  const myNotes         = modules.filter(m => !m.isPublic);

  const filterMods = (list) =>
    list.filter(m =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // ── Note CRUD ──────────────────────────────────────
  const openCreateNote = () => {
    setEditingNote(null);
    setNoteForm({
      title: '', description: '', subject: '', isPublic: false,
      chapters: [{ title: '', content: '', fileUrl: '', order: 0 }],
      quiz: [],
    });
    setActiveTab('info');
    setShowNoteModal(true);
  };

  const openEditNote = (mod) => {
    setEditingNote(mod);
    setNoteForm({
      title: mod.title, description: mod.description || '',
      subject: mod.subject?._id || '', isPublic: mod.isPublic || false,
      chapters: mod.chapters?.length ? mod.chapters : [{ title: '', content: '', fileUrl: '', order: 0 }],
      quiz: mod.quiz || [],
    });
    setActiveTab('info');
    setShowNoteModal(true);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) return alert('Title is required');
    setSubmitting(true);
    try {
      if (editingNote) {
        await axios.put(`${API}/modules/${editingNote._id}`, noteForm, { headers: authHeaders() });
      } else {
        await axios.post(`${API}/modules`, noteForm, { headers: authHeaders() });
      }
      setShowNoteModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      await axios.delete(`${API}/modules/${id}`, { headers: authHeaders() });
      fetchData();
    } catch (err) {
      alert('Could not delete');
    }
  };

  // ── Chapter helpers ────────────────────────────────
  const addChapter = () =>
    setNoteForm(f => ({ ...f, chapters: [...f.chapters, { title: '', content: '', fileUrl: '', order: f.chapters.length }] }));
  const updateChapter = (i, field, value) => {
    const updated = [...noteForm.chapters];
    updated[i] = { ...updated[i], [field]: value };
    setNoteForm(f => ({ ...f, chapters: updated }));
  };
  const removeChapter = (i) =>
    setNoteForm(f => ({ ...f, chapters: f.chapters.filter((_, idx) => idx !== i) }));

  // ── Close reader and refresh to show updated progress ──
  const handleCloseReader = () => {
    setViewMod(null);
    fetchData(); // refresh so card progress bar updates
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="loading-container">
          <div className="loading-spinner-large" />
          <p>Loading modules...</p>
        </div>
      </DashboardLayout>
    );
  }

  const displayed = activeSection === 'official'
    ? filterMods(officialModules)
    : filterMods(myNotes);

  return (
    <DashboardLayout>
      <div className="modules-page">

        {/* ── Header ── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Learning Modules 📚</h1>
            <p className="page-subtitle">Study official content or manage your personal notes</p>
          </div>
          {activeSection === 'mynotes' && (
            <motion.button
              className="add-btn"
              onClick={openCreateNote}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <FiPlus /> Add My Notes
            </motion.button>
          )}
        </div>

        {/* ── Section Toggle ── */}
        <div className="section-toggle">
          <button
            className={`section-btn ${activeSection === 'official' ? 'active' : ''}`}
            onClick={() => setActiveSection('official')}
          >
            <FiBook /> Official Modules
            <span className="section-count">{officialModules.length}</span>
          </button>
          <button
            className={`section-btn ${activeSection === 'mynotes' ? 'active' : ''}`}
            onClick={() => setActiveSection('mynotes')}
          >
            <FiFileText /> My Notes
            <span className="section-count">{myNotes.length}</span>
          </button>
        </div>

        {/* ── Search ── */}
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder={activeSection === 'official' ? 'Search official modules...' : 'Search your notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Section Description ── */}
        {activeSection === 'official' ? (
          <div className="section-info official-info">
            <FiBook size={16} />
            <span>These modules are provided by SmartLearn. Read the chapters and take quizzes to test your knowledge!</span>
          </div>
        ) : (
          <div className="section-info notes-info">
            <FiFileText size={16} />
            <span>Your personal study notes. Keep them private or share publicly with other students.</span>
          </div>
        )}

        {/* ── Grid ── */}
        {displayed.length === 0 ? (
          <div className="empty-state-page">
            <div className="empty-icon">{activeSection === 'official' ? '📚' : '📝'}</div>
            <h3>{activeSection === 'official' ? 'No official modules yet' : 'No notes yet'}</h3>
            <p>
              {activeSection === 'official'
                ? 'Official study modules will appear here once added.'
                : 'Start adding your personal study notes!'}
            </p>
            {activeSection === 'mynotes' && (
              <button className="empty-action-btn" onClick={openCreateNote}>
                <FiPlus /> Add My Notes
              </button>
            )}
          </div>
        ) : (
          <div className="modules-grid">
            {displayed.map((mod, i) => (
              <ModuleCard
                key={mod._id}
                mod={mod}
                index={i}
                isOfficial={activeSection === 'official'}
                progress={getProgress(mod)}
                onRead={() => setViewMod(mod)}
                onQuiz={() => setQuizMod(mod)}
                onEdit={() => openEditNote(mod)}
                onDelete={() => handleDelete(mod._id)}
              />
            ))}
          </div>
        )}

        {/* ── Modals ── */}
        <AnimatePresence>
          {viewMod && (
            <ChapterReaderModal
              mod={viewMod}
              onClose={handleCloseReader}
              onStartQuiz={() => { setViewMod(null); setQuizMod(viewMod); }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {quizMod && (
            <QuizModal
              mod={quizMod}
              onClose={() => { setQuizMod(null); fetchData(); }}
              onSubmitQuiz={async (answers) => {
                try {
                  const res = await axios.post(
                    `${API}/modules/${quizMod._id}/progress`,
                    { quizAnswers: answers },
                    { headers: authHeaders() }
                  );
                  return res.data;
                } catch (err) {
                  console.error(err);
                  return null;
                }
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showNoteModal && (
            <NoteModal
              editingNote={editingNote}
              form={noteForm}
              setForm={setNoteForm}
              subjects={subjects}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              submitting={submitting}
              onSubmit={handleNoteSubmit}
              onClose={() => setShowNoteModal(false)}
              addChapter={addChapter}
              updateChapter={updateChapter}
              removeChapter={removeChapter}
            />
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
};

// ══════════════════════════════════════════════════════
// MODULE CARD
// ══════════════════════════════════════════════════════
const ModuleCard = ({ mod, index, isOfficial, progress, onRead, onQuiz, onEdit, onDelete }) => (
  <motion.div
    className="module-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    whileHover={{ y: -4 }}
  >
    <div className="module-card-top">
      <div className="module-badges">
        {mod.subject && (
          <span className="mod-badge" style={{ background: (mod.subject.color || '#6C63FF') + '20', color: mod.subject.color || '#6C63FF' }}>
            <FiBook size={10} /> {mod.subject.name}
          </span>
        )}
        {isOfficial
          ? <span className="mod-badge badge-purple"><FiAward size={10} /> Official</span>
          : mod.isPublic
            ? <span className="mod-badge badge-green"><FiGlobe size={10} /> Public</span>
            : <span className="mod-badge badge-gray"><FiLock size={10} /> Private</span>
        }
        {mod.myProgress?.quizPassed && (
          <span className="mod-badge badge-gold"><FiCheckCircle size={10} /> Completed</span>
        )}
      </div>
    </div>

    <h3 className="mod-title">{mod.title}</h3>
    <p className="mod-desc">{mod.description || 'No description provided.'}</p>

    <div className="mod-progress-label">
      Progress · {mod.myProgress?.chaptersCompleted || 0}/{mod.chapters?.length || 0} chapters · {progress}%
    </div>
    <div className="mod-progress-bar">
      <div
        className={`mod-progress-fill ${progress === 100 ? 'done' : 'active'}`}
        style={{ width: `${progress}%` }}
      />
    </div>

    <div className="mod-stats">
      <span><FiFileText size={12} /> {mod.chapters?.length || 0} chapters</span>
      <span>❓ {mod.quiz?.length || 0} quiz Qs</span>
      <span>👤 {mod.createdBy?.name || 'You'}</span>
    </div>

    <div className="mod-actions">
      {isOfficial ? (
        <>
          <button className="task-btn mod-read-btn" onClick={onRead}>
            <FiBook /> Read
          </button>
          {mod.quiz?.length > 0 && (
            <button className="task-btn mod-quiz-btn" onClick={onQuiz}>
              <FiPlay /> Take Quiz
            </button>
          )}
        </>
      ) : (
        <>
          <button className="task-btn mod-read-btn" onClick={onRead}>
            <FiBook /> View
          </button>
          <button className="task-btn edit-btn" onClick={onEdit}><FiEdit2 /></button>
          <button className="task-btn delete-btn" onClick={onDelete}><FiTrash2 /></button>
        </>
      )}
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════
// CHAPTER READER MODAL — with progress saving
// ══════════════════════════════════════════════════════
const ChapterReaderModal = ({ mod, onClose, onStartQuiz }) => {
  const chapters = mod.chapters || [];

  // ── Restore saved progress: start on first unread chapter ──
  const savedCompleted = mod.myProgress?.chaptersCompleted || [];
  // chaptersCompleted from API list is a count, but from single module GET it's an array
  // Handle both: if it's an array use it, otherwise start at 0
  const completedIndexes = Array.isArray(savedCompleted) ? savedCompleted : [];

  const firstUnread = chapters.findIndex((_, i) => !completedIndexes.includes(i));
  const [currentChapter, setCurrentChapter] = useState(
    firstUnread >= 0 ? firstUnread : 0
  );
  const [localCompleted, setLocalCompleted] = useState(new Set(completedIndexes));
  const [saving, setSaving] = useState(false);

  const ch = chapters[currentChapter];

  // ── Mark chapter as read when viewed ──────────────────
  useEffect(() => {
    if (chapters.length === 0) return;
    if (localCompleted.has(currentChapter)) return; // already saved

    const markRead = async () => {
      setSaving(true);
      await saveChapterProgress(mod._id, currentChapter);
      setLocalCompleted(prev => new Set([...prev, currentChapter]));
      setSaving(false);
    };

    // Small delay so it feels intentional (not instant on open)
    const timer = setTimeout(markRead, 1500);
    return () => clearTimeout(timer);
  }, [currentChapter]);

  const progressPct = chapters.length === 0
    ? 0
    : Math.round((localCompleted.size / chapters.length) * 100);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-container modal-reader"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <p className="reader-module-name">{mod.title}</p>
            <h2>{ch?.title || 'Chapter'}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saving && <span className="reader-saving-badge">Saving...</span>}
            <button className="modal-close" onClick={onClose}><FiX /></button>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="reader-overall-progress">
          <div className="reader-overall-bar">
            <div
              className="reader-overall-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="reader-overall-label">
            {localCompleted.size}/{chapters.length} chapters read · {progressPct}%
          </span>
        </div>

        {/* Chapter sidebar + content */}
        <div className="reader-body">

          {/* Sidebar */}
          <div className="reader-sidebar">
            <p className="sidebar-label">Chapters</p>
            {chapters.map((c, i) => (
              <button
                key={i}
                className={`sidebar-ch-btn ${currentChapter === i ? 'active' : ''}`}
                onClick={() => setCurrentChapter(i)}
              >
                <span className={`ch-num-small ${localCompleted.has(i) ? 'ch-done' : ''}`}>
                  {localCompleted.has(i) ? '✓' : i + 1}
                </span>
                <span className="ch-title-small">{c.title || `Chapter ${i + 1}`}</span>
              </button>
            ))}

            {mod.quiz?.length > 0 && (
              <button className="sidebar-quiz-btn" onClick={onStartQuiz}>
                <FiPlay size={12} /> Take Quiz
              </button>
            )}
          </div>

          {/* Content */}
          <div className="reader-content">
            {chapters.length === 0 ? (
              <div className="reader-empty">No chapters available yet.</div>
            ) : (
              <>
                <div className="reader-chapter-meta">
                  {localCompleted.has(currentChapter) && (
                    <span className="reader-read-badge">✅ Read</span>
                  )}
                </div>

                <h3 className="reader-chapter-title">{ch?.title}</h3>
                <div className="reader-text">{ch?.content || 'No content for this chapter.'}</div>

                {ch?.fileUrl && (
                  <a href={ch.fileUrl} target="_blank" rel="noreferrer" className="file-link">
                    <FiFileText /> View attached PDF / File
                  </a>
                )}

                {/* Navigation */}
                <div className="reader-nav">
                  <button
                    className="reader-nav-btn"
                    onClick={() => setCurrentChapter(p => Math.max(0, p - 1))}
                    disabled={currentChapter === 0}
                  >
                    <FiArrowLeft /> Previous
                  </button>
                  <span className="reader-nav-label">{currentChapter + 1} / {chapters.length}</span>
                  {currentChapter < chapters.length - 1 ? (
                    <button
                      className="reader-nav-btn"
                      onClick={() => setCurrentChapter(p => p + 1)}
                    >
                      Next <FiArrowRight />
                    </button>
                  ) : mod.quiz?.length > 0 ? (
                    <button className="reader-nav-btn quiz-trigger-btn" onClick={onStartQuiz}>
                      Take Quiz <FiPlay />
                    </button>
                  ) : (
                    <button className="reader-nav-btn" disabled>Done ✅</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
// QUIZ MODAL
// ══════════════════════════════════════════════════════
const QuizModal = ({ mod, onClose, onSubmitQuiz }) => {
  const questions = mod.quiz || [];
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState(null);

  const q = questions[current];

  const selectAnswer = (oi) => {
    const updated = [...answers];
    updated[current] = oi;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    const data = await onSubmitQuiz(answers);
    let correct = 0;
    const details = questions.map((q, i) => {
      const isCorrect = answers[i] === q.correctAnswer;
      if (isCorrect) correct++;
      return { question: q.question, options: q.options, chosen: answers[i], correct: q.correctAnswer, isCorrect };
    });
    setResult({ score: data?.quizScore ?? Math.round((correct / questions.length) * 100), passed: data?.quizPassed, details });
    setSubmitted(true);
  };

  if (questions.length === 0) {
    return (
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div className="modal-container" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>No Quiz Available</h2>
            <button className="modal-close" onClick={onClose}><FiX /></button>
          </div>
          <div className="modal-form" style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#9CA3AF' }}>This module doesn't have any quiz questions yet.</p>
            <button className="btn-primary" style={{ marginTop: '20px', maxWidth: '200px' }} onClick={onClose}>Close</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal-container modal-quiz"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="reader-module-name">{mod.title}</p>
            <h2>{submitted ? '🏆 Quiz Results' : `Question ${current + 1} of ${questions.length}`}</h2>
          </div>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-form quiz-body">
          {!submitted && (
            <>
              <div className="quiz-dots">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`quiz-dot ${i === current ? 'current' : answers[i] !== null ? 'answered' : ''}`}
                    onClick={() => setCurrent(i)}
                  />
                ))}
              </div>

              <div className="mod-progress-bar" style={{ marginBottom: '24px' }}>
                <div className="mod-progress-fill active" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
              </div>

              <p className="quiz-question">{q.question}</p>

              <div className="quiz-options-list">
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    className={`quiz-option-btn ${answers[current] === oi ? 'selected' : ''}`}
                    onClick={() => selectAnswer(oi)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                ))}
              </div>

              <div className="quiz-nav">
                <button className="btn-secondary" onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}>
                  <FiArrowLeft /> Previous
                </button>
                {current < questions.length - 1 ? (
                  <button className="btn-primary" onClick={() => setCurrent(p => p + 1)} disabled={answers[current] === null}>
                    Next <FiArrowRight />
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleSubmit} disabled={answers.includes(null)}>
                    Submit Quiz <FiCheckCircle />
                  </button>
                )}
              </div>
              {answers.includes(null) && current === questions.length - 1 && (
                <p className="quiz-warning">⚠️ Please answer all questions before submitting</p>
              )}
            </>
          )}

          {submitted && result && (
            <>
              <div className="results-score-box">
                <div className={`score-circle ${result.passed ? 'passed' : 'failed'}`}>
                  <span className="score-number">{result.score}%</span>
                  <span className="score-label">{result.passed ? '🎉 Passed!' : '😔 Failed'}</span>
                </div>
                <p className="score-sub">
                  {result.passed
                    ? 'Great job! You passed this quiz.'
                    : 'You need 70% to pass. Review the chapters and try again!'}
                </p>
              </div>

              <div className="results-breakdown">
                <h3 className="breakdown-title">Answer Review</h3>
                {result.details.map((d, i) => (
                  <div key={i} className={`result-item ${d.isCorrect ? 'correct' : 'wrong'}`}>
                    <div className="result-item-header">
                      <span className="result-icon">{d.isCorrect ? '✅' : '❌'}</span>
                      <span className="result-question">Q{i + 1}: {d.question}</span>
                    </div>
                    <div className="result-answers">
                      <span className="your-answer">
                        Your answer: <strong style={{ color: d.isCorrect ? '#10B981' : '#EF4444' }}>
                          {d.chosen !== null ? d.options[d.chosen] : 'Not answered'}
                        </strong>
                      </span>
                      {!d.isCorrect && (
                        <span className="correct-answer">
                          Correct: <strong style={{ color: '#10B981' }}>{d.options[d.correct]}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={onClose}>Close</button>
                {!result.passed && (
                  <button className="btn-primary" onClick={() => {
                    setAnswers(Array(questions.length).fill(null));
                    setCurrent(0);
                    setSubmitted(false);
                    setResult(null);
                  }}>
                    Retry Quiz
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════
// NOTE MODAL
// ══════════════════════════════════════════════════════
const NoteModal = ({
  editingNote, form, setForm, subjects, activeTab, setActiveTab,
  submitting, onSubmit, onClose, addChapter, updateChapter, removeChapter
}) => (
  <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div
      className="modal-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={e => e.stopPropagation()}
    >
      <div className="modal-header">
        <h2>{editingNote ? '✏️ Edit Notes' : '📝 Add My Notes'}</h2>
        <button className="modal-close" onClick={onClose}><FiX /></button>
      </div>

      <div className="mod-tabs">
        {['info', 'chapters'].map(t => (
          <button key={t} className={`mod-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'info' ? '📋 Info' : '📝 Chapters / Notes'}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="modal-form">
        {activeTab === 'info' && (
          <>
            <div className="form-group">
              <label>Title</label>
              <input type="text" placeholder="e.g. My Calculus Notes" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description <span className="optional">(optional)</span></label>
              <textarea placeholder="What are these notes about?" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} rows="3" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Subject <span className="optional">(optional)</span></label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Visibility</label>
                <label className="toggle-label">
                  <input type="checkbox" checked={form.isPublic}
                    onChange={e => setForm({ ...form, isPublic: e.target.checked })} />
                  <span className="toggle-text">
                    {form.isPublic ? <><FiGlobe /> Public — others can see</> : <><FiLock /> Private — only you</>}
                  </span>
                </label>
              </div>
            </div>
          </>
        )}

        {activeTab === 'chapters' && (
          <div className="chapters-list">
            {form.chapters.map((ch, i) => (
              <div key={i} className="chapter-item">
                <div className="chapter-item-header">
                  <span className="chapter-num">Note {i + 1}</span>
                  {form.chapters.length > 1 && (
                    <button type="button" className="remove-item-btn" onClick={() => removeChapter(i)}><FiX /></button>
                  )}
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" placeholder="Note title" value={ch.title}
                    onChange={e => updateChapter(i, 'title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <textarea placeholder="Write your notes here..." value={ch.content}
                    onChange={e => updateChapter(i, 'content', e.target.value)} rows="4" />
                </div>
                <div className="form-group">
                  <label>File / PDF URL <span className="optional">(optional)</span></label>
                  <input type="text" placeholder="https://..." value={ch.fileUrl}
                    onChange={e => updateChapter(i, 'fileUrl', e.target.value)} />
                </div>
              </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addChapter}>
              <FiPlus /> Add Note Section
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : editingNote ? 'Save Changes' : 'Save Notes'}
          </button>
        </div>
      </form>
    </motion.div>
  </motion.div>
);

export default Modules;