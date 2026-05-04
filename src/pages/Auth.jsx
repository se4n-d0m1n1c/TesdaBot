import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, BookOpen, ChevronRight, User, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn({ email, password });
        if (error) throw error;
      } else {
        const { error } = await signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              ncii_track: 'Computer Systems Servicing NCII' // Default for now
            }
          }
        });
        if (error) throw error;
        // Optionally, inform user to check email if email confirmation is on
        // but let's assume they log in directly or need to confirm.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Brand Side */}
      <div className="auth-brand-side">
        <div className="auth-content animate-fade-in">
          <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
            <div className="bg-white p-3 rounded-circle shadow-lg" style={{ color: 'var(--tb-accent)' }}>
              <BookOpen size={40} />
            </div>
            <h1 className="display-4 fw-bold mb-0 text-white">TESDA-Bot</h1>
          </div>
          <h2 className="h3 text-white-50 mb-4 fw-light">
            Your 24/7 Interactive Guide for NCII Certification Success
          </h2>
          <div className="d-flex flex-column gap-3 text-start bg-white bg-opacity-10 p-4 rounded-4 tb-glass">
            <div className="d-flex align-items-center gap-3">
              <Shield className="text-warning" size={24} />
              <span className="text-white">Master complex TESDA training regulations</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <BookOpen className="text-warning" size={24} />
              <span className="text-white">Unlimited hint-based practice exams</span>
            </div>
            <div className="d-flex align-items-center gap-3">
              <ChevronRight className="text-warning" size={24} />
              <span className="text-white">Pressure-free, self-paced learning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-container animate-fade-in delay-100">
          <div className="text-center mb-5">
            <h2 className="fw-bold mb-2" style={{ color: 'var(--tb-text-heading)' }}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted">
              {isLogin ? 'Sign in to continue your NCII preparation' : 'Join thousands of TechVoc students succeeding today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
                <AlertCircle size={18} /> <small>{error}</small>
              </div>
            )}
            {!isLogin && (
              <div className="form-group position-relative">
                <User className="position-absolute text-muted" style={{ top: '12px', left: '15px' }} size={20} />
                <input 
                  type="text" 
                  className="form-control form-control-lg bg-light border-0 ps-5" 
                  placeholder="Full Name" 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ borderRadius: 'var(--tb-radius-md)' }}
                />
              </div>
            )}
            
            <div className="form-group position-relative">
              <Mail className="position-absolute text-muted" style={{ top: '12px', left: '15px' }} size={20} />
              <input 
                type="email" 
                className="form-control form-control-lg bg-light border-0 ps-5" 
                placeholder="Email Address" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderRadius: 'var(--tb-radius-md)' }}
              />
            </div>

            <div className="form-group position-relative">
              <Lock className="position-absolute text-muted" style={{ top: '12px', left: '15px' }} size={20} />
              <input 
                type="password" 
                className="form-control form-control-lg bg-light border-0 ps-5" 
                placeholder="Password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ borderRadius: 'var(--tb-radius-md)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 mt-2 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')} {!loading && <ChevronRight size={20} />}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-muted">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                className="btn btn-link p-0 fw-semibold text-decoration-none" 
                style={{ color: 'var(--tb-accent)' }}
                onClick={() => setIsLogin(!isLogin)}
                type="button"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
