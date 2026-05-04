import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Vercel React Best Practices: bundle-dynamic-imports
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChatbotInterface = lazy(() => import('./components/Chatbot/ChatbotInterface'));
const QuizEngine = lazy(() => import('./components/Assessment/QuizEngine'));

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
  const { signOut } = useAuth();
  
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut();
  };

  return (
    <div className="app-layout d-flex flex-column min-vh-100">
      {/* Top Navbar could go here, or Sidebar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary px-4 py-3 shadow-sm tb-glass" style={{ background: 'var(--tb-primary)' }}>
        <div className="container-fluid">
          <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="/dashboard" style={{ fontFamily: 'var(--tb-font-display)' }}>
            <span style={{ color: 'var(--tb-accent)' }}>⚡</span> TESDA-Bot
          </a>
          <div className="d-flex gap-3">
            <a href="/dashboard" className="nav-link text-white">Dashboard</a>
            <a href="/chat" className="nav-link text-white">Ask Bot</a>
            <a href="/quiz" className="nav-link text-white">Practice Exam</a>
            <button onClick={handleSignOut} className="btn btn-link nav-link text-white opacity-75 text-decoration-none">Sign Out</button>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
