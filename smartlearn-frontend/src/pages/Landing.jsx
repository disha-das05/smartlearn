// ============================================
// SmartLearn - Landing Page
// ============================================

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiBook, FiArrowRight, FiZap, FiTarget, FiTrendingUp, FiCpu, FiAward } from 'react-icons/fi';
import './Landing.css';


// ---- Particle Component ----
const Particles = () => {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.6 + 0.1,
  }));

  return (
    <div className="particles-container">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ---- Typewriter Component ----
const Typewriter = ({ words }) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = words[currentWord];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(word.substring(0, currentText.length + 1));
        if (currentText === word) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setCurrentText(word.substring(0, currentText.length - 1));
        if (currentText === '') {
          setIsDeleting(false);
          setCurrentWord((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? 60 : 100);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWord, words]);

  return (
    <span className="typewriter">
      {currentText}
      <span className="cursor">|</span>
    </span>
  );
};

// ---- Floating Card Component ----
const FloatingCard = ({ icon, title, desc, delay, x, y }) => (
  <motion.div
    className="floating-card"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: 1,
      scale: 1,
      y: [0, -12, 0],
    }}
    transition={{
      opacity: { delay, duration: 0.6 },
      scale: { delay, duration: 0.6 },
      y: { delay, duration: 3 + delay, repeat: Infinity, ease: 'easeInOut' }
    }}
  >
    <div className="floating-card-icon">{icon}</div>
    <div>
      <div className="floating-card-title">{title}</div>
      <div className="floating-card-desc">{desc}</div>
    </div>
  </motion.div>
);

// ---- Feature Card Component ----
const FeatureCard = ({ icon, title, desc, color, delay }) => (
  <motion.div
    className="feature-card"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    whileHover={{ y: -8, scale: 1.02 }}
  >
    <div className="feature-icon" style={{ background: color }}>
      {icon}
    </div>
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

// ---- Main Landing Page ----
const Landing = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  

  const features = [
    {
      icon: <FiZap />,
      title: 'Smart Study Planner',
      desc: 'AI automatically distributes your study hours based on deadlines and priorities.',
      color: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      delay: 0.1,
    },
    {
      icon: <FiTarget />,
      title: 'Task Management',
      desc: 'Track every assignment, set priorities and never miss a deadline again.',
      color: 'linear-gradient(135deg, #6C63FF, #A78BFA)',
      delay: 0.2,
    },
    {
      icon: <FiTrendingUp />,
      title: 'Progress Tracking',
      desc: 'Beautiful charts and insights to visualize your study performance over time.',
      color: 'linear-gradient(135deg, #10B981, #34D399)',
      delay: 0.3,
    },
    {
      icon: <FiCpu />,
      title: 'AI Study Assistant',
      desc: 'Ask anything and get instant, easy-to-understand explanations powered by AI.',
      color: 'linear-gradient(135deg, #F472B6, #EC4899)',
      delay: 0.4,
    },
    {
      icon: <FiBook />,
      title: 'Guided Learning Modules',
      desc: 'Learn any topic step by step with simple explanations, examples and summaries.',
      color: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
      delay: 0.5,
    },
    {
      icon: <FiAward />,
      title: 'Practice Quizzes',
      desc: 'Test your knowledge with smart quizzes and track your scores over time.',
      color: 'linear-gradient(135deg, #8B5CF6, #6C63FF)',
      delay: 0.6,
    },
  ];

  return (
    <div className="landing">
      {/* ---- Particles ---- */}
      <Particles />

      {/* ---- Background ---- */}
      <div className="landing-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* ---- Navbar ---- */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="nav-logo">
          <FiBook className="nav-logo-icon" />
          <span>SmartLearn</span>
        </div>
        <div className="nav-links">
        
          <motion.button
            className="nav-btn-outline"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
          <motion.button
            className="nav-btn-solid"
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </div>
      </motion.nav>

      {/* ---- Hero Section ---- */}
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-content" style={{ y, opacity }}>

          {/* Badge */}
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <span className="badge-dot" />
            AI-Powered Learning Platform
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Study <span className="gradient-text">Smarter</span>,<br />
            Not <span className="gradient-text-2">Harder</span>
          </motion.h1>

          {/* Typewriter */}
          <motion.div
            className="hero-typewriter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Built for students who want to{' '}
            <Typewriter words={[
              'ace their exams 🎯',
              'manage time better ⏰',
              'reduce study stress 😌',
              'learn with AI help 🤖',
              'track their progress 📈',
            ]} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            SmartLearn combines AI-powered study planning, guided lessons,
            and an intelligent assistant to help you achieve your academic goals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.button
              className="cta-primary"
              onClick={() => navigate('/register')}
              whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(108,99,255,0.6)' }}
              whileTap={{ scale: 0.97 }}
            >
              Start Learning Free
              <FiArrowRight className="cta-arrow" />
            </motion.button>
            <motion.button
              className="cta-secondary"
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              I have an account
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              { number: '10K+', label: 'Students' },
              { number: '95%', label: 'Less Stress' },
              { number: '3x', label: 'More Productive' },
            ].map((stat, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating Cards */}
        <div className="floating-cards-container">
          <FloatingCard
            icon="📚"
            title="Subject and Task Management"
            desc="add subjects and create study tasks with deadlines"
            delay={1}
            x="5%"
            y="20%"
          />
          <FloatingCard
            icon="📊"
            title="Smart Study Planner"
            desc="System distributes study hours across available days based on deadlines and workload"
            delay={1.2}
            x="70%"
            y="15%"
          />
          <FloatingCard
            icon="🤖"
            title="AI Assistant"
            desc="Ready to help you learn"
            delay={1.4}
            x="80%"
            y="60%"
          />
          <FloatingCard
            icon="✅"
            title="Practice Questions and Quizzes"
            desc="Topic includes questions and quizzes to help students understand"
            delay={1.6}
            x="10%"
            y="55%"
          />
        </div>
      </section>

      {/* ---- Features Section ---- */}
      <section className="features-section">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="section-badge">Features</div>
          <h2>Everything you need to <span className="gradient-text">excel</span></h2>
          <p>Powerful tools designed specifically for students</p>
        </motion.div>

        <div className="features-grid">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className="cta-section">
        <motion.div
          className="cta-card"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="cta-orb" />
          <h2>Ready to transform<br />your studies? 🚀</h2>
          <p>Join thousands of students already using SmartLearn</p>
          <motion.button
            className="cta-primary"
            onClick={() => navigate('/register')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started — It's Free
            <FiArrowRight className="cta-arrow" />
          </motion.button>
        </motion.div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <FiBook />
          <span>SmartLearn</span>
        </div>
        <p>Made with for students everywhere</p>
      </footer>
    </div>
  );
};

export default Landing;