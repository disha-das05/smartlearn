const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Task = require('../models/Task');
const Subject = require('../models/Subject');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Build a rich system prompt from the student's real data ──────
const buildSystemPrompt = async (userId) => {
  try {
    const now = new Date();

    // Fetch subjects
    const subjects = await Subject.find({ user: userId });

    // Fetch all tasks
    const allTasks = await Task.find({ user: userId }).populate('subject', 'name');

    const pendingTasks  = allTasks.filter(t => t.status !== 'completed');
    const overdueTasks  = pendingTasks.filter(t => t.deadline && new Date(t.deadline) < now);
    const completedTasks = allTasks.filter(t => t.status === 'completed');

    // Upcoming tasks in next 7 days
    const urgentTasks = pendingTasks
      .filter(t => {
        if (!t.deadline) return false;
        const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);

    // Completion rate
    const completionRate = allTasks.length > 0
      ? Math.round((completedTasks.length / allTasks.length) * 100)
      : 0;

    // Build readable summaries
    const subjectList = subjects.length > 0
      ? subjects.map(s => s.name).join(', ')
      : 'No subjects added yet';

    const overdueList = overdueTasks.length > 0
      ? overdueTasks.map(t => `"${t.title}" (${t.subject?.name || 'No subject'})`).join(', ')
      : 'None';

    const urgentList = urgentTasks.length > 0
      ? urgentTasks.map(t => {
          const days = Math.ceil((new Date(t.deadline) - now) / (1000 * 60 * 60 * 24));
          return `"${t.title}" due in ${days}d (${t.priority} priority)`;
        }).join(', ')
      : 'None in the next 7 days';

    return `You are SmartLearn AI, a highly personalized study assistant built into the SmartLearn student platform.

You have access to this student's real academic data. Use it naturally in your responses to give specific, relevant advice.

═══ STUDENT'S CURRENT DATA ═══

📚 Subjects they are studying: ${subjectList}

📋 Task overview:
- Total tasks: ${allTasks.length}
- Completed: ${completedTasks.length} (${completionRate}% completion rate)
- Pending: ${pendingTasks.length}
- Overdue: ${overdueTasks.length}

⚠️ Overdue tasks: ${overdueList}

⏰ Urgent (due within 7 days): ${urgentList}

═══ YOUR BEHAVIOUR RULES ═══

1. ALWAYS be aware of the student's actual tasks and subjects. Reference them naturally.
2. If the student asks what they should study, look at their overdue and urgent tasks and give specific advice.
3. If they ask a general academic question, relate it to their subjects when possible.
4. Be encouraging but honest — if they have overdue tasks, gently flag it.
5. Keep responses clear, friendly, and student-appropriate.
6. Use markdown formatting: **bold**, bullet points, and code blocks when helpful.
7. If asked to explain something, break it into simple steps with examples.
8. ONLY help with study, learning, and academic topics. Politely decline anything unrelated.
9. Never make up task data — only reference what is shown above.`;

  } catch (err) {
    console.error('Error building system prompt:', err.message);
    // Fallback to basic prompt if data fetch fails
    return `You are SmartLearn AI, a helpful and friendly study assistant for students.
Help students understand academic subjects, explain concepts clearly, answer questions,
and provide study strategies. Keep responses clear, concise, and student-friendly.
Only help with study and academic topics.`;
  }
};

// @route   POST /api/ai/chat
// @desc    Send a message to Gemini AI (SmartLearn-aware)
// @access  Private
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, history, subject } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ msg: 'Message is required' });
    }

    // Build personalised system prompt with student's real data
    const systemContext = await buildSystemPrompt(req.user.id);

    // Append subject context if user selected one
    const fullContext = subject
      ? `${systemContext}\n\nThe student is currently focused on: ${subject}. Tailor your responses to this subject.`
      : systemContext;

    // Get the Gemini model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: fullContext,
    });

    // Build chat history (exclude the initial welcome message)
    const chatHistory = (history || [])
      .filter((_, i) => i > 0) // skip welcome message
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Start chat and send message
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      reply: text,
      timestamp: new Date(),
    });

  } catch (err) {
    console.error('Gemini API error:', err.message);
    if (err.message?.includes('API_KEY')) {
      return res.status(500).json({ msg: 'Invalid API key. Check your GEMINI_API_KEY in .env' });
    }
    res.status(500).json({ msg: 'AI service error. Please try again.' });
  }
});

module.exports = router;