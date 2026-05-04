import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle, ArrowRight, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const fetcher = async ([url, track]) => {
  if (url === 'questions') {
    const { data, error } = await supabase.from('questions').select('*').eq('ncii_track', track);
    if (error) throw error;
    // For randomizing or selecting a subset, we could do it here. 
    // For now, return all matching questions.
    return data;
  }
};

const QuizEngine = () => {
  const { user } = useAuth();
  const nciiTrack = user?.user_metadata?.ncii_track || 'Computer Systems Servicing NCII';

  const { data: questions, error, isLoading } = useSWR(user ? ['questions', nciiTrack] : null, fetcher);

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentQuestion = questions && questions.length > 0 ? questions[currentQuestionIdx] : null;

  const handleSelect = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
    } else {
      setIsFinished(true);
      // Save result to Supabase
      if (user) {
        setSaving(true);
        try {
          await supabase.from('assessment_records').insert([
            {
              user_id: user.id,
              ncii_track: nciiTrack,
              module: 'Practice Exam', // In a real scenario, group questions by module
              score: score + (selectedOption === currentQuestion.correct_option_index ? 1 : 0),
              total_questions: questions.length
            }
          ]);
        } catch (err) {
          console.error("Failed to save score", err);
        } finally {
          setSaving(false);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <Loader2 className="spinner-border text-primary" />
        <span className="ms-3">Loading questions...</span>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="alert alert-warning mt-5">
        <AlertCircle size={20} className="me-2" />
        No practice questions available for your track yet.
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="tb-card p-5 text-center mx-auto mt-5 animate-fade-in" style={{ maxWidth: '500px' }}>
        <div className="mb-4">
          <div className="d-inline-flex p-4 rounded-circle bg-success bg-opacity-10 text-success mb-3">
            <CheckCircle size={64} />
          </div>
          <h2 className="fw-bold">Assessment Complete!</h2>
          <p className="text-muted">You have successfully finished the practice module.</p>
        </div>
        
        <div className="display-1 fw-bold mb-4" style={{ color: 'var(--tb-primary)' }}>
          {score}<span className="text-muted fs-3">/{questions.length}</span>
        </div>
        
        {saving && <p className="text-muted small"><Loader2 size={12} className="spinner-border spinner-border-sm" /> Saving result...</p>}

        <div className="d-flex gap-3 justify-content-center">
          <button className="btn btn-outline-primary px-4" onClick={() => window.location.reload()}>Retry</button>
          <a href="/dashboard" className="btn btn-primary px-4">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 animate-fade-in" style={{ maxWidth: '800px' }}>
      {/* Header Progress */}
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--tb-text-heading)' }}>Practice Exam</h2>
          <p className="text-muted mb-0">Module: Computer Systems Servicing NCII</p>
        </div>
        <div className="text-end">
          <span className="fw-bold fs-5 text-primary">Question {currentQuestionIdx + 1}</span>
          <span className="text-muted"> of {questions.length}</span>
        </div>
      </div>

      <div className="progress mb-4" style={{ height: '8px' }}>
        <div 
          className="progress-bar bg-accent" 
          style={{ 
            width: `${((currentQuestionIdx) / questions.length) * 100}%`,
            backgroundColor: 'var(--tb-accent)'
          }}
        ></div>
      </div>

      {/* Question Card */}
      <div className="tb-card mb-4 border-0 shadow-lg">
        <div className="p-4 p-md-5">
          <h3 className="fw-semibold mb-4 lh-base">{currentQuestion.question_text}</h3>
          
          <div className="d-flex flex-column gap-3">
            {currentQuestion.options.map((opt, idx) => {
              let btnClass = "btn btn-light text-start p-3 border position-relative";
              if (isAnswered) {
                if (idx === currentQuestion.correct_option_index) {
                  btnClass = "btn btn-success text-start p-3 border-success text-white position-relative";
                } else if (idx === selectedOption) {
                  btnClass = "btn btn-danger text-start p-3 border-danger text-white position-relative";
                }
              } else if (idx === selectedOption) {
                btnClass = "btn btn-primary text-start p-3 border-primary position-relative";
              }

              return (
                <button 
                  key={idx} 
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  style={{ borderRadius: 'var(--tb-radius-md)', transition: 'all 0.2s ease' }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fs-5">{opt}</span>
                    {isAnswered && idx === currentQuestion.correct_option_index && <CheckCircle size={20} />}
                    {isAnswered && idx === selectedOption && idx !== currentQuestion.correct_option_index && <XCircle size={20} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint Section */}
          <div className="mt-4 pt-4 border-top">
            {!showHint ? (
              <button 
                className="btn btn-link text-muted text-decoration-none p-0 d-flex align-items-center gap-2"
                onClick={() => setShowHint(true)}
                disabled={isAnswered}
              >
                <HelpCircle size={18} /> Need a hint?
              </button>
            ) : (
              <div className="bg-warning bg-opacity-10 p-3 rounded-3 d-flex gap-3 animate-fade-in" style={{ borderLeft: '4px solid var(--tb-accent)' }}>
                <Lightbulb className="text-warning flex-shrink-0" size={24} />
                <p className="mb-0 text-dark">{currentQuestion.hint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        {isAnswered && (
          <div className="bg-light p-4 d-flex justify-content-end border-top rounded-bottom animate-fade-in">
            <button className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2" onClick={handleNext} disabled={saving}>
              {currentQuestionIdx < questions.length - 1 ? 'Next Question' : 'View Results'} <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizEngine;
