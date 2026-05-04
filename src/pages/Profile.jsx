import React, { useState, useEffect } from 'react';
import { User, BookOpenCheck, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const fetchTracks = async () => {
  const { data, error } = await supabase.from('ncii_tracks').select('name').order('name');
  if (error) throw error;
  return data;
};

const Profile = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [track, setTrack] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const { data: tracks, isLoading: tracksLoading } = useSWR('ncii_tracks', fetchTracks);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setTrack(user.user_metadata?.ncii_track || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          ncii_track: track
        }
      });
      if (authError) throw authError;

      // 2. Update Public Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          ncii_track: track,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      setStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{ maxWidth: '800px' }}>
      <div className="d-flex align-items-center gap-3 mb-4 mb-md-5">
        <div className="bg-primary bg-opacity-10 p-3 rounded-circle" style={{ color: 'var(--tb-primary)' }}>
          <User size={32} />
        </div>
        <div>
          <h1 className="fw-bold mb-1" style={{ color: 'var(--tb-text-heading)' }}>Your Profile</h1>
          <p className="text-muted mb-0">Manage your account details and NCII track</p>
        </div>
      </div>

      <div className="tb-card p-4 p-md-5">
        {status && (
          <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-2 mb-4`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-4">
          <div className="form-group">
            <label className="fw-semibold mb-2" style={{ color: 'var(--tb-text-main)' }}>Full Name</label>
            <div className="position-relative">
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
          </div>

          <div className="form-group">
            <label className="fw-semibold mb-2" style={{ color: 'var(--tb-text-main)' }}>Selected NCII Track</label>
            <div className="position-relative">
              <BookOpenCheck className="position-absolute text-muted" style={{ top: '12px', left: '15px' }} size={20} />
              {tracksLoading ? (
                <div className="form-control form-control-lg bg-light border-0 ps-5 text-muted d-flex align-items-center">
                  Loading tracks...
                </div>
              ) : (
                <select 
                  className="form-select form-control-lg bg-light border-0 ps-5" 
                  required 
                  value={track}
                  onChange={(e) => setTrack(e.target.value)}
                  style={{ borderRadius: 'var(--tb-radius-md)' }}
                >
                  <option value="" disabled>Select NCII Track</option>
                  {tracks?.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <small className="text-muted mt-2 d-block">
              Changing your track will alter the practice questions and chatbot context.
            </small>
          </div>

          <hr className="my-2 border-light" />

          <div className="d-flex justify-content-end">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg d-flex align-items-center gap-2 px-5" 
              disabled={saving}
            >
              {saving ? <Loader2 size={20} className="spinner-border spinner-border-sm" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
