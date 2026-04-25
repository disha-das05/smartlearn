// ============================================
// SmartLearn - AI Assistant Page (Enhanced)
// src/pages/AIAssistant.jsx
// ============================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSend, FiTrash2, FiUser, FiBookOpen,
  FiAlertCircle, FiClock, FiCheckCircle
} from 'react-icons/fi';
import DashboardLayout from '../components/DashboardLayout';
import { subjectsAPI, tasksAPI } from '../services/api';
import logo from '../assets/logo.png';
import './AIAssistant.css';

// ── Simple markdown renderer ──────────────────────────────────────
const renderMarkdown = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
};

// ── Message bubble ────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="bubble-avatar">
        {isUser
          ? <FiUser />
          : <img src={logo} alt="SL" className="ai-logo-avatar" />
        }
      </div>
      <div className="bubble-content">
        <div className="bubble-name">{isUser ? 'You' : 'SmartLearn AI'}</div>
        <div
          className="bubble-text"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
        />
        <div className="bubble-time">
          {new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </div>
    </motion.div>
  );
};

// ── Typing indicator ──────────────────────────────────────────────
const TypingIndicator = () => (
  <motion.div
    className="message-bubble ai-bubble"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="bubble-avatar">
      <img src={logo} alt="SL" className="ai-logo-avatar" />
    </div>
    <div className="bubble-content">
      <div className="bubble-name">SmartLearn AI</div>
      <div className="typing-dots">
        <span /><span /><span />
      </div>
    </div>
  </motion.div>
);

// ── Main Component ────────────────────────────────────────────────
const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => { loadStudentData(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Load student data then build welcome message ──────────────
  const loadStudentData = async () => {
    try {
      const [subRes, taskRes] = await Promise.all([
        subjectsAPI.getAll(),
        tasksAPI.getAll(),
      ]);
      const fetchedSubjects = subRes.data;
      const fetchedTasks    = taskRes.data;

      setSubjects(fetchedSubjects);
      setTasks(fetchedTasks);
      setDataLoaded(true);

      const now          = new Date();
      const overdue      = fetchedTasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
      const pending      = fetchedTasks.filter(t => t.status !== 'completed');
      const subjectNames = fetchedSubjects.map(s => s.name);

      // Single \n instead of \n\n — compact line spacing
      let welcome = `Hi! I'm **SmartLearn AI**, your personal study assistant.`;

      if (subjectNames.length > 0) {
        welcome += `\nI can see you're studying: **${subjectNames.join(', ')}**.`;
      }

      if (overdue.length > 0) {
        welcome += `\n⚠️ Heads up — you have **${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}**. Want me to help you tackle them?`;
      } else if (pending.length > 0) {
        welcome += `\nYou have **${pending.length} pending task${pending.length > 1 ? 's' : ''}** — you're on track! 💪`;
      }

      welcome += `\nHow can I help you study today?`;

      setMessages([{ role: 'ai', content: welcome, timestamp: new Date() }]);

    } catch (err) {
      console.error('Error loading student data:', err);
      setMessages([{
        role: 'ai',
        content: "Hi! I'm **SmartLearn AI**, your personal study assistant.\nHow can I help you today?",
        timestamp: new Date(),
      }]);
    }
  };

  // ── Build context-aware quick prompts ────────────────────────
  const getQuickPrompts = () => {
    const now     = new Date();
    const overdue = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
    const urgent  = tasks
      .filter(t => {
        if (!t.deadline || t.status === 'completed') return false;
        const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 3;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const prompts = [];

    if (overdue.length > 0) {
      prompts.push({
        label: `⚠️ Help with overdue tasks`,
        text: `I have ${overdue.length} overdue tasks. Can you help me prioritize and make a plan to catch up?`,
        highlight: true,
      });
    }

    if (urgent.length > 0) {
      prompts.push({
        label: `⏰ ${urgent[0].title} — due soon`,
        text: `Help me study for "${urgent[0].title}" which is due soon. Give me key points and a quick study plan.`,
      });
    }

    if (subjects.length > 0) {
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      prompts.push({
        label: `🧠 Quiz me on ${randomSubject.name}`,
        text: `Quiz me on ${randomSubject.name}. Ask me 5 questions one at a time.`,
      });
      prompts.push({
        label: `📖 Study tips for ${randomSubject.name}`,
        text: `Give me effective study tips and strategies for ${randomSubject.name}.`,
      });
    }

    prompts.push(
      { label: '📝 Explain a concept', text: 'Can you explain ' },
      { label: '💡 Make a study plan', text: "Based on my current tasks and subjects, can you make me a study plan for today?" },
      { label: '🔍 Give me examples', text: 'Give me clear examples of ' },
      { label: '📊 Compare concepts', text: 'Compare and contrast ' },
    );

    return prompts.slice(0, 7);
  };

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const token = localStorage.getItem('token');

      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ message: text, history, subject: selectedSubject }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to get response');

      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.reply,
        timestamp: new Date(data.timestamp),
      }]);
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '❌ Sorry, I had trouble responding. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const now     = new Date();
    const overdue = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
    setMessages([{
      role: 'ai',
      content: overdue.length > 0
        ? `👋 Chat cleared! Just a reminder — you still have **${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}**. Want help with those?`
        : "👋 Chat cleared! What would you like to study?",
      timestamp: new Date(),
    }]);
  };

  const now       = new Date();
  const overdue   = tasks.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < now);
  const pending   = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <DashboardLayout>
      <div className="ai-page">

        {/* ── Header ── */}
        <div className="ai-header">
          <div>
            <h1 className="page-title">AI Assistant 🤖</h1>
            <p className="page-subtitle">Your personalised study companion — knows your subjects, tasks & deadlines</p>
          </div>
          <div className="ai-header-actions">
            <div className="subject-selector">
              <FiBookOpen />
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(s => (
                  <option key={s._id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <motion.button className="clear-btn" onClick={clearChat}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <FiTrash2 /> Clear
            </motion.button>
          </div>
        </div>

        {/* ── Context Stats Bar ── */}
        {dataLoaded && tasks.length > 0 && (
          <div className="ai-context-bar">
            <span className="ai-context-label">AI knows about:</span>
            <div className="ai-context-pills">
              <span className="ai-pill ai-pill-purple">
                <FiBookOpen size={11} /> {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
              </span>
              <span className="ai-pill ai-pill-blue">
                <FiClock size={11} /> {pending.length} pending
              </span>
              <span className="ai-pill ai-pill-green">
                <FiCheckCircle size={11} /> {completed.length} completed
              </span>
              {overdue.length > 0 && (
                <span className="ai-pill ai-pill-red">
                  <FiAlertCircle size={11} /> {overdue.length} overdue
                </span>
              )}
            </div>
          </div>
        )}

        <div className="ai-layout">

          {/* ── Chat Area ── */}
          <div className="chat-container">
            <div className="messages-area">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  ref={inputRef}
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your studies..."
                  rows={1}
                  disabled={loading}
                />
                <motion.button
                  className={`send-btn ${loading || !input.trim() ? 'disabled' : ''}`}
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                >
                  <FiSend />
                </motion.button>
              </div>
              <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </div>

          {/* ── Quick Prompts Sidebar ── */}
          <div className="quick-prompts">
            <h3>Quick Actions</h3>
            <div className="prompts-list">
              {getQuickPrompts().map((prompt, i) => (
                <motion.button
                  key={i}
                  className={`prompt-btn ${prompt.highlight ? 'prompt-btn-urgent' : ''}`}
                  onClick={() => {
                    if (prompt.text.endsWith('?') || prompt.text.endsWith('.')) {
                      sendMessage(prompt.text);
                    } else {
                      setInput(prompt.text);
                      inputRef.current?.focus();
                    }
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {prompt.label}
                </motion.button>
              ))}
            </div>

            <div className="ai-tips">
              <h4>💡 Tips</h4>
              <ul>
                <li>I know your tasks & deadlines</li>
                <li>Ask "what should I study today?"</li>
                <li>Select a subject for focused help</li>
                <li>Ask me to quiz you on any topic</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistant;