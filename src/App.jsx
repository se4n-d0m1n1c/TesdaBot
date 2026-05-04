import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Vercel React Best Practices: bundle-dynamic-imports
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChatbotInterface = lazy(() => import('./components/Chatbot/ChatbotInterface'));
const QuizEngine = lazy(() => import('./components/Assessment/QuizEngine'));
const Profile = lazy(() => import('./pages/Profile'));

// A simple loading fallback
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Private Route Wrapper
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
};

// Layout Wrapper
const AppLayout = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { signOut } = useAuth();
  
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut();
  };

  return (
    <div className="app-layout d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 py-3 shadow-sm tb-glass" style={{ background: 'var(--tb-primary)' }}>
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2 m-0" href="/dashboard" style={{ fontFamily: 'var(--tb-font-display)' }}>
            <span style={{ color: 'var(--tb-accent)' }}>⚡</span> TESDA-Bot
          </a>
          
          <button className="btn btn-link text-white d-lg-none p-0 border-0" onClick={() => setIsNavOpen(!isNavOpen)}>
            {isNavOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <div className={`navbar-collapse d-lg-flex ${isNavOpen ? 'nav-mobile-menu open' : 'nav-mobile-menu'} d-lg-block w-100`}>
            <div className="navbar-nav ms-auto gap-2 gap-lg-4 text-center text-lg-start align-items-lg-center">
              <a href="/dashboard" className="nav-link text-white fw-medium">Dashboard</a>
              <a href="/chat" className="nav-link text-white fw-medium">Ask Bot</a>
              <a href="/quiz" className="nav-link text-white fw-medium">Practice Exam</a>
              <a href="/profile" className="nav-link text-white fw-medium">Profile</a>
              <button onClick={handleSignOut} className="btn btn-outline-light rounded-pill px-4 mt-2 mt-lg-0 border-opacity-50 ms-lg-2">Sign Out</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow-1 p-4 bg-light">
        <div className="container-lg">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><AppLayout><ChatbotInterface /></AppLayout></PrivateRoute>} />
            <Route path="/quiz" element={<PrivateRoute><AppLayout><QuizEngine /></AppLayout></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
