import React from 'react';
import { BookOpen, Award, Clock, ArrowRight, Target, Flame, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const fetcher = async (url) => {
  if (url === 'assessments') {
    const { data, error } = await supabase.from('assessment_records').select('*').order('completed_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: assessments, error, isLoading } = useSWR(user ? 'assessments' : null, fetcher);

  const nciiTrack = user?.user_metadata?.ncii_track || 'Computer Systems Servicing NCII';
  const fullName = user?.user_metadata?.full_name || 'Student';

  // Calculate metrics
  let totalScore = 0;
  let totalQuestions = 0;
  let modulesMastered = 0;
  
  if (assessments && assessments.length > 0) {
    assessments.forEach(record => {
      totalScore += record.score;
      totalQuestions += record.total_questions;
      if (record.score / record.total_questions >= 0.8) {
        modulesMastered += 1;
      }
    });
  }

  const overallReadiness = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

  return (
    <div className="animate-fade-in">
      {/* Welcome Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4 mb-md-5">
        <div>
          <h1 className="fw-bold mb-1" style={{ color: 'var(--tb-text-heading)' }}>Welcome back, {fullName}!</h1>
          <p className="text-muted mb-0">{nciiTrack} • {overallReadiness}% Readiness</p>
        </div>
        <div className="d-flex align-items-center gap-2 bg-white px-4 py-2 rounded-pill shadow-sm border">
          <Flame size={20} className="text-danger" />
          <span className="fw-bold">3 Day Streak</span>
        </div>
      </div>

      {/* Progress Overview Grid */}
      <div className="row g-3 g-md-4 mb-4 mb-md-5">
        <div className="col-12 col-md-4">
          <div className="tb-card p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded-3" style={{ color: 'var(--tb-primary)' }}>
                <Target size={24} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Overall Readiness</h5>
                <span className="text-muted small">Based on practice tests</span>
              </div>
            </div>
            {isLoading ? (
              <div className="mt-4 text-center text-muted"><Loader2 className="spinner-border spinner-border-sm" /></div>
            ) : (
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">{overallReadiness}%</span>
                  <span className="text-success fw-semibold">{overallReadiness >= 80 ? 'Ready' : 'In Progress'}</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div className="progress-bar bg-success" role="progressbar" style={{ width: `${overallReadiness}%` }} aria-valuenow={overallReadiness} aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="tb-card p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-warning bg-opacity-10 p-3 rounded-3" style={{ color: 'var(--tb-accent)' }}>
                <Award size={24} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Modules Mastered</h5>
                <span className="text-muted small">Completed with 80%+</span>
              </div>
            </div>
            {isLoading ? (
              <div className="mt-3 text-center text-muted"><Loader2 className="spinner-border spinner-border-sm" /></div>
            ) : (
              <div className="mt-3">
                <h2 className="display-5 fw-bold mb-0">{modulesMastered}</h2>
                <p className="text-muted small mb-0 mt-1">Keep practicing to master more modules</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="tb-card p-4 h-100">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-info bg-opacity-10 p-3 rounded-3 text-info">
                <Clock size={24} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Study Hours</h5>
                <span className="text-muted small">This week</span>
              </div>
            </div>
            <div className="mt-3">
              <h2 className="display-5 fw-bold mb-0">12<span className="fs-5 text-muted fw-normal">h</span> 30<span className="fs-5 text-muted fw-normal">m</span></h2>
              <p className="text-muted small mb-0 mt-1">+2h compared to last week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h4 className="fw-bold mb-3 mb-md-4" style={{ color: 'var(--tb-text-heading)' }}>Continue Learning</h4>
      <div className="row g-3 g-md-4">
        <div className="col-12 col-md-6">
          <div className="tb-card p-4 d-flex flex-column h-100 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="fw-bold mb-1">Interact with TESDA-Bot</h5>
                <p className="text-muted small mb-0">Review "Networking Concepts" module</p>
              </div>
              <div className="bg-light p-2 rounded-circle">
                <BookOpen size={20} className="text-primary" />
              </div>
            </div>
            <p className="mb-4 text-secondary">Have questions about IP Subnetting? The bot is ready to help you break down complex concepts into simple steps.</p>
            <button onClick={() => navigate('/chat')} className="btn btn-primary mt-auto align-self-start d-flex align-items-center gap-2">
              Start Chat <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="tb-card p-4 d-flex flex-column h-100 border-start border-4" style={{ borderLeftColor: 'var(--tb-accent) !important' }}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h5 className="fw-bold mb-1">Take Practice Exam</h5>
                <p className="text-muted small mb-0">Module 5: Server Configuration</p>
              </div>
              <div className="bg-light p-2 rounded-circle">
                <Target size={20} style={{ color: 'var(--tb-accent)' }} />
              </div>
            </div>
            <p className="mb-4 text-secondary">Test your knowledge with 20 hint-based questions. No pressure, just practice to build your confidence.</p>
            <button onClick={() => navigate('/quiz')} className="btn btn-accent mt-auto align-self-start d-flex align-items-center gap-2">
              Start Exam <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
