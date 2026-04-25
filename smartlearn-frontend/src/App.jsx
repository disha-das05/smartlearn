import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Subjects from './pages/Subjects';
import Planner from './pages/Planner';
import Progress from './pages/Progress';
import AIAssistant from './pages/AIAssistant';
import Modules from './pages/Modules';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
      <Route path="/planner" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
      <Route path="/learning" element={<ProtectedRoute><Modules /></ProtectedRoute>} />
      <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
      <Route path="/modules" element={<ProtectedRoute><Modules /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;