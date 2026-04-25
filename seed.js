// ============================================
// SmartLearn - Seed Official Learning Modules
// Run: node seed.js
// ============================================

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const LearningModule = require('./models/LearningModule');
const User = require('./models/User');

const officialModules = [
  {
    title: 'Introduction to Programming',
    description: 'Learn the fundamentals of programming — variables, loops, functions and more.',
    isPublic: true,
    creatorRole: 'admin',
    chapters: [
      {
        title: 'What is Programming?',
        content: `Programming is the process of writing instructions for a computer to execute. These instructions are written in a programming language like Python, JavaScript, or Java.\n\nA program is simply a set of step-by-step instructions that tells the computer what to do. Just like a recipe tells you how to cook a meal, a program tells the computer how to perform a task.\n\nKey concepts:\n- Source code: The human-readable instructions you write\n- Compiler/Interpreter: Translates your code into machine language\n- Output: The result your program produces`,
        order: 0,
      },
      {
        title: 'Variables and Data Types',
        content: `A variable is a container that stores data. Think of it as a labeled box where you can put information.\n\nCommon data types:\n1. Integer (int) — whole numbers like 5, -10, 100\n2. Float — decimal numbers like 3.14, -0.5\n3. String — text like "Hello World"\n4. Boolean — true or false values\n\nExamples:\n  age = 20         (integer)\n  gpa = 9.5        (float)\n  name = "Alice"   (string)\n  isPassed = true  (boolean)\n\nVariables make your code flexible and reusable!`,
        order: 1,
      },
      {
        title: 'Loops and Conditions',
        content: `Conditions let your program make decisions.\n\nIF Statement:\n  if (score >= 90) {\n    print("Grade A")\n  } else if (score >= 75) {\n    print("Grade B")\n  } else {\n    print("Grade C")\n  }\n\nLoops let you repeat actions:\n\nFOR Loop — repeat a fixed number of times:\n  for (i = 1 to 5) {\n    print(i)\n  }\n  Output: 1 2 3 4 5\n\nWHILE Loop — repeat while a condition is true:\n  while (count < 3) {\n    print("Hello")\n    count++\n  }`,
        order: 2,
      },
      {
        title: 'Functions',
        content: `A function is a reusable block of code that performs a specific task.\n\nWhy use functions?\n- Avoid repeating the same code\n- Makes code easier to read\n- Easy to fix bugs in one place\n\nExample:\n  function greet(name) {\n    return "Hello, " + name + "!"\n  }\n\n  greet("Alice")  → "Hello, Alice!"\n  greet("Bob")    → "Hello, Bob!"\n\nTypes of functions:\n1. Built-in functions — already provided by the language (print, length)\n2. User-defined functions — written by you\n3. Recursive functions — functions that call themselves`,
        order: 3,
      },
    ],
    quiz: [
      {
        question: 'What is a variable in programming?',
        options: [
          'A fixed value that never changes',
          'A container that stores data',
          'A type of loop',
          'A function name',
        ],
        correctAnswer: 1,
      },
      {
        question: 'Which data type would you use to store a person\'s name?',
        options: ['Integer', 'Boolean', 'String', 'Float'],
        correctAnswer: 2,
      },
      {
        question: 'What does a FOR loop do?',
        options: [
          'Makes a decision based on a condition',
          'Stores a value in memory',
          'Repeats code a fixed number of times',
          'Defines a reusable block of code',
        ],
        correctAnswer: 2,
      },
      {
        question: 'What is the main benefit of using functions?',
        options: [
          'They make code run faster',
          'They allow code reuse and avoid repetition',
          'They store data permanently',
          'They replace loops',
        ],
        correctAnswer: 1,
      },
    ],
  },

  {
    title: 'Study Skills & Time Management',
    description: 'Master effective study techniques, time management and exam preparation strategies.',
    isPublic: true,
    creatorRole: 'admin',
    chapters: [
      {
        title: 'The Pomodoro Technique',
        content: `The Pomodoro Technique is a time management method developed by Francesco Cirillo.\n\nHow it works:\n1. Choose a task to work on\n2. Set a timer for 25 minutes\n3. Work on the task with full focus\n4. Take a 5-minute break\n5. After 4 rounds, take a longer 15-30 minute break\n\nWhy it works:\n- Breaks work into manageable chunks\n- Reduces mental fatigue\n- Creates urgency which helps focus\n- Regular breaks improve retention\n\nTip: Use the breaks to stretch, drink water, or take a short walk — not to check social media!`,
        order: 0,
      },
      {
        title: 'Active Recall & Spaced Repetition',
        content: `Active Recall means testing yourself on material rather than just re-reading it.\n\nInstead of: Reading your notes 5 times\nDo this: Close your notes and try to recall the information from memory\n\nSpaced Repetition means reviewing material at increasing intervals:\n- Day 1: Learn new material\n- Day 2: Review it\n- Day 4: Review again\n- Day 7: Review again\n- Day 14: Review again\n\nThis fights the "forgetting curve" — our natural tendency to forget information over time.\n\nTools you can use:\n- Flashcards (physical or apps like Anki)\n- Practice tests\n- Teaching the concept to someone else`,
        order: 1,
      },
      {
        title: 'Creating an Effective Study Schedule',
        content: `A good study schedule helps you stay consistent and avoid last-minute cramming.\n\nSteps to create your schedule:\n1. List all subjects and topics to cover\n2. Check exam/assignment deadlines\n3. Estimate time needed per topic\n4. Block study time in your calendar\n5. Add buffer time for revision\n\nGolden rules:\n- Study difficult subjects when your energy is highest\n- Keep sessions to 1-2 hours max before a break\n- Review notes within 24 hours of a lecture\n- Leave weekends for revision and rest\n\nAvoid:\n- Studying for 6+ hours straight\n- Starting assignments the night before\n- Skipping planned study sessions`,
        order: 2,
      },
    ],
    quiz: [
      {
        question: 'How long is one focused work session in the Pomodoro Technique?',
        options: ['15 minutes', '25 minutes', '45 minutes', '60 minutes'],
        correctAnswer: 1,
      },
      {
        question: 'What is Active Recall?',
        options: [
          'Re-reading your notes multiple times',
          'Highlighting important text',
          'Testing yourself by recalling information from memory',
          'Listening to recorded lectures',
        ],
        correctAnswer: 2,
      },
      {
        question: 'What does Spaced Repetition help fight against?',
        options: [
          'Exam anxiety',
          'The forgetting curve',
          'Poor handwriting',
          'Slow reading speed',
        ],
        correctAnswer: 1,
      },
    ],
  },

  {
    title: 'Mathematics Fundamentals',
    description: 'Core mathematics concepts including algebra, geometry and basic statistics.',
    isPublic: true,
    creatorRole: 'admin',
    chapters: [
      {
        title: 'Algebra Basics',
        content: `Algebra uses letters (variables) to represent unknown values in equations.\n\nKey concepts:\n\n1. Expressions vs Equations\n   Expression: 3x + 5  (no equals sign)\n   Equation:   3x + 5 = 14  (has equals sign)\n\n2. Solving simple equations:\n   3x + 5 = 14\n   3x = 14 - 5\n   3x = 9\n   x = 3\n\n3. Rules to remember:\n   - Whatever you do to one side, do to the other\n   - Combine like terms first\n   - BODMAS/PEMDAS order of operations\n\n4. Quadratic equations: ax² + bx + c = 0\n   Use the formula: x = (-b ± √(b²-4ac)) / 2a`,
        order: 0,
      },
      {
        title: 'Geometry Essentials',
        content: `Geometry deals with shapes, sizes, and properties of figures.\n\nImportant formulas:\n\nTriangle:\n  Area = ½ × base × height\n  Perimeter = a + b + c\n  Angles sum = 180°\n\nCircle:\n  Area = π r²\n  Circumference = 2πr\n  Diameter = 2r\n\nRectangle:\n  Area = length × width\n  Perimeter = 2(l + w)\n\nPythagoras Theorem (right triangles):\n  a² + b² = c²\n  (c is always the longest side — hypotenuse)\n\nExample: If a=3 and b=4, then c = √(9+16) = √25 = 5`,
        order: 1,
      },
      {
        title: 'Basic Statistics',
        content: `Statistics helps us understand and interpret data.\n\nMeasures of Central Tendency:\n\n1. Mean (Average)\n   Add all values, divide by count\n   Example: [4, 7, 8, 5, 6] → Mean = 30/5 = 6\n\n2. Median (Middle value)\n   Sort the data, find the middle\n   Example: [4, 5, 6, 7, 8] → Median = 6\n   Even count: average the two middle values\n\n3. Mode (Most frequent)\n   Example: [4, 5, 5, 6, 7] → Mode = 5\n\nMeasures of Spread:\n- Range = Maximum - Minimum\n- Variance = average of squared differences from mean\n- Standard Deviation = √Variance\n\nSmaller standard deviation = data is close together\nLarger standard deviation = data is spread out`,
        order: 2,
      },
    ],
    quiz: [
      {
        question: 'Solve for x: 2x + 6 = 14',
        options: ['x = 3', 'x = 4', 'x = 5', 'x = 10'],
        correctAnswer: 1,
      },
      {
        question: 'What is the area of a circle with radius 7? (Use π ≈ 3.14)',
        options: ['43.96', '153.86', '21.98', '78.5'],
        correctAnswer: 1,
      },
      {
        question: 'Find the mean of: 10, 20, 30, 40, 50',
        options: ['25', '30', '35', '20'],
        correctAnswer: 1,
      },
      {
        question: 'In a right triangle, if a=6 and b=8, what is c (hypotenuse)?',
        options: ['12', '14', '10', '11'],
        correctAnswer: 2,
      },
    ],
  },
];

const seedDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected!');

    // Find or create an admin user to assign as creator
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      // Use the first user in the DB as the admin/creator
      adminUser = await User.findOne();
      if (!adminUser) {
        console.error('❌ No users found in database. Please register at least one user first!');
        process.exit(1);
      }
      console.log(`⚠️  No admin user found. Using "${adminUser.name}" as module creator.`);
    } else {
      console.log(`👤 Using admin: "${adminUser.name}"`);
    }

    // Delete existing official (public) modules to avoid duplicates
    const deleted = await LearningModule.deleteMany({ isPublic: true });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing official modules`);

    // Insert new modules
    const toInsert = officialModules.map(m => ({
      ...m,
      createdBy: adminUser._id,
    }));

    const inserted = await LearningModule.insertMany(toInsert);
    console.log(`\n🌱 Seeded ${inserted.length} official modules:`);
    inserted.forEach(m => console.log(`   ✅ ${m.title}`));

    console.log('\n🎉 Done! Official modules are now live in SmartLearn.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedDB();