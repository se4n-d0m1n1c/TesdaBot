import React, { useState, useEffect, useRef } from 'react';
import { User, BookOpenCheck, Save, Loader2, AlertCircle, CheckCircle, Camera } from 'lucide-react';
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
  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [track, setTrack] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

  const { data: tracks, isLoading: tracksLoading } = useSWR('ncii_tracks', fetchTracks);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setTrack(user.user_metadata?.ncii_track || '');
      setAvatarUrl(user.user_metadata?.avatar_url || '');
    }
  }, [user]);

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true);
      setStatus(null);

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Select image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      setStatus({ type: 'success', message: 'Avatar uploaded! Save profile to confirm.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      // 1. Update Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          ncii_track: track,
          avatar_url: avatarUrl
        }
      });
      if (authError) throw authError;

      // 2. Update Public Profiles Table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          ncii_track: track,
          avatar_url: avatarUrl,
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
        <div className="position-relative">
          <div 
            className="rounded-circle overflow-hidden bg-primary bg-opacity-10 d-flex align-items-center justify-content-center border" 
            style={{ width: '80px', height: '80px', border: '2px solid var(--tb-primary) !important' }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-100 h-100 object-fit-cover" />
            ) : (
              <User size={40} className="text-primary" style={{ color: 'var(--tb-primary)' }} />
            )}
          </div>
          <button 
            type="button"
            className="btn btn-primary rounded-circle p-1 position-absolute shadow-sm d-flex align-items-center justify-content-center"
            style={{ bottom: '-5px', right: '-5px', width: '28px', height: '28px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Change Avatar"
          >
            {uploading ? <Loader2 size={14} className="spinner-border spinner-border-sm" /> : <Camera size={14} />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="d-none" 
            accept="image/*" 
            onChange={handleAvatarUpload}
          />
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
              disabled={saving || uploading}
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
