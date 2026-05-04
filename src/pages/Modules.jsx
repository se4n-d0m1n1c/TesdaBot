import React from 'react';
import { BookOpen, CheckCircle2, MessageSquare, PlayCircle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const fetcher = async ([url, track]) => {
  if (url === 'modules') {
    const { data, error } = await supabase.from('modules').select('*').eq('track_name', track);
    if (error) throw error;
    return data;
  }
  if (url === 'records') {
    const { data, error } = await supabase.from('assessment_records').select('*').eq('ncii_track', track);
    if (error) throw error;
    return data;
  }
};

const Modules = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const nciiTrack = user?.user_metadata?.ncii_track || 'Computer Systems Servicing NCII';

  const { data: modules, isLoading: modulesLoading } = useSWR(user ? ['modules', nciiTrack] : null, fetcher);
  const { data: records, isLoading: recordsLoading } = useSWR(user ? ['records', nciiTrack] : null, fetcher);

  const getModuleStatus = (moduleName) => {
    if (!records) return null;
    const moduleRecords = records.filter(r => r.module === moduleName);
    if (moduleRecords.length === 0) return 'Not Started';
    
    const bestScore = Math.max(...moduleRecords.map(r => r.score / r.total_questions));
    return bestScore >= 0.8 ? 'Mastered' : 'In Progress';
  };

  if (modulesLoading || recordsLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Loader2 className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-5">
      {/* Header */}
      <div className="mb-5">
        <h1 className="fw-bold mb-2" style={{ color: 'var(--tb-text-heading)' }}>Training Modules</h1>
        <p className="text-muted fs-5">{nciiTrack}</p>
      </div>

      {/* Modules Grid */}
      <div className="row g-4">
        {modules?.map((mod) => {
          const status = getModuleStatus(mod.name);
          return (
            <div key={mod.id} className="col-12 col-lg-6">
              <div className="tb-card h-100 border-0 shadow-sm hover-shadow transition-all d-flex flex-column">
                <div className="p-4 p-md-5 flex-grow-1">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div className={`badge rounded-pill px-3 py-2 ${
                      status === 'Mastered' ? 'bg-success bg-opacity-10 text-success' : 
                      status === 'In Progress' ? 'bg-primary bg-opacity-10 text-primary' : 
                      'bg-secondary bg-opacity-10 text-secondary'
                    }`}>
                      {status === 'Mastered' && <CheckCircle2 size={14} className="me-1 mb-1" />}
                      {status}
                    </div>
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <Clock size={14} /> {mod.estimated_time}
                    </div>
                  </div>

                  <h3 className="fw-bold mb-3">{mod.name}</h3>
                  <p className="text-secondary mb-4">{mod.description}</p>
                </div>

                <div className="p-4 bg-light bg-opacity-50 border-top mt-auto">
                  <div className="row g-2">
                    <div className="col-6">
                      <button 
                        onClick={() => navigate('/quiz', { state: { module: mod.name } })}
                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                      >
                        <PlayCircle size={18} /> Practice
                      </button>
                    </div>
                    <div className="col-6">
                      <button 
                        onClick={() => navigate('/chat', { state: { module: mod.name } })}
                        className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                      >
                        <MessageSquare size={18} /> Ask Bot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Modules;
