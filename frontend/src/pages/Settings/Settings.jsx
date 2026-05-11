import React, { useState, useEffect } from 'react';
import { User, Building2, Key, Save, LogOut, Eye, EyeOff, Palette, Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';
import api from '../../api/client';

const Settings = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    first_name: '',
    last_name: '',
    company_name: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Theme
  const [theme, setTheme] = useState(localStorage.getItem('hirevex_theme') || 'dark');

  // Preferences
  const [prefs, setPrefs] = useState({
    itemsPerPage: localStorage.getItem('hirevex_items_per_page') || '20',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        company_name: user.company_name || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('auth/me/', {
        full_name: profile.full_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        company_name: profile.company_name,
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.warning('Password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('auth/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Failed to change password';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('hirevex_items_per_page', prefs.itemsPerPage);
    toast.success('Preferences saved');
  };

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'company', label: 'Company Details', icon: Building2 },
    { id: 'password', label: 'Password', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Settings</h1>
        <p className="text-on-surface-variant mt-1 text-sm">Manage your account settings and preferences.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto hide-scrollbar border-b md:border-b-0 md:border-r border-[rgba(73,69,79,0.15)] pb-4 md:pb-0 md:pr-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          
          <div className="hidden md:block mt-auto pt-8">
            <button onClick={logout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-status-error hover:bg-status-error/10 transition-colors w-full">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 pb-8">
          <div className="max-w-3xl">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card glass-card">
                  <h3 className="text-lg font-bold mb-4 border-b border-[rgba(73,69,79,0.15)] pb-4">Personal Information</h3>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-2xl font-bold">
                      {profile.first_name?.[0] || user?.full_name?.[0] || 'A'}{profile.last_name?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{profile.full_name || 'Admin'}</p>
                      <p className="text-xs text-on-surface-variant">{user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        className="input-field w-full" 
                        value={profile.full_name} 
                        onChange={e => setProfile({...profile, full_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">First Name</label>
                      <input 
                        type="text" 
                        className="input-field w-full" 
                        value={profile.first_name} 
                        onChange={e => setProfile({...profile, first_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Last Name</label>
                      <input 
                        type="text" 
                        className="input-field w-full" 
                        value={profile.last_name} 
                        onChange={e => setProfile({...profile, last_name: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Email Address</label>
                      <input type="email" className="input-field w-full opacity-60" value={user?.email || ''} disabled />
                      <p className="text-[10px] text-on-surface-variant mt-1">Email cannot be changed.</p>
                    </div>
                    <div className="space-y-1.5 col-span-1 md:col-span-2">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Role</label>
                      <input type="text" className="input-field w-full opacity-60" value={user?.role === 'hr' ? 'HR / Recruiter' : user?.role || 'Administrator'} disabled />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button className="btn-secondary" onClick={() => setProfile({ full_name: user?.full_name || '', first_name: user?.first_name || '', last_name: user?.last_name || '', company_name: user?.company_name || '' })}>Cancel</button>
                  <button className="btn-primary flex items-center gap-2" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card glass-card">
                  <h3 className="text-lg font-bold mb-4 border-b border-[rgba(73,69,79,0.15)] pb-4">Company Profile</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Company Name</label>
                      <input 
                        type="text" 
                        className="input-field w-full" 
                        value={profile.company_name} 
                        onChange={e => setProfile({...profile, company_name: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="btn-primary flex items-center gap-2" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : <><Save size={16} /> Save Company Details</>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card glass-card">
                  <h3 className="text-lg font-bold mb-4 border-b border-[rgba(73,69,79,0.15)] pb-4">Change Password</h3>
                  
                  <div className="grid grid-cols-1 gap-4 max-w-md">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Current Password</label>
                      <div className="relative">
                        <input 
                          type={showOldPw ? 'text' : 'password'}
                          className="input-field w-full pr-10" 
                          value={passwordForm.old_password} 
                          onChange={e => setPasswordForm({...passwordForm, old_password: e.target.value})}
                          placeholder="Enter current password"
                        />
                        <button onClick={() => setShowOldPw(!showOldPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                          {showOldPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">New Password</label>
                      <div className="relative">
                        <input 
                          type={showNewPw ? 'text' : 'password'}
                          className="input-field w-full pr-10" 
                          value={passwordForm.new_password} 
                          onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                          placeholder="At least 8 characters"
                        />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="input-field w-full" 
                        value={passwordForm.confirm_password} 
                        onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        placeholder="Re-enter new password"
                      />
                      {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                        <p className="text-[10px] text-status-error mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    className="btn-primary flex items-center gap-2" 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || !passwordForm.old_password || !passwordForm.new_password || passwordForm.new_password !== passwordForm.confirm_password}
                  >
                    {changingPassword ? 'Changing...' : <><Key size={16} /> Change Password</>}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6 animate-fade-in">
                <div className="card glass-card">
                  <h3 className="text-lg font-bold mb-4 border-b border-[rgba(73,69,79,0.15)] pb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                        { id: 'light', label: 'Light', icon: Sun, desc: 'Coming soon' },
                        { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            localStorage.setItem('hirevex_theme', t.id);
                            toast.success(`Theme set to ${t.label}`);
                          }}
                          disabled={t.id === 'light'}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            theme === t.id
                              ? 'border-primary bg-primary/10'
                              : t.id === 'light' 
                                ? 'border-[rgba(73,69,79,0.1)] bg-surface-container opacity-50 cursor-not-allowed'
                                : 'border-[rgba(73,69,79,0.15)] bg-surface-container hover:border-primary/30'
                          }`}
                        >
                          <t.icon size={20} className={theme === t.id ? 'text-primary mb-2' : 'text-on-surface-variant mb-2'} />
                          <p className="text-sm font-semibold">{t.label}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card glass-card">
                  <h3 className="text-lg font-bold mb-4 border-b border-[rgba(73,69,79,0.15)] pb-4">Display</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Items per page</label>
                      <select
                        value={prefs.itemsPerPage}
                        onChange={e => setPrefs({...prefs, itemsPerPage: e.target.value})}
                        className="input-field w-48"
                      >
                        <option value="10">10 items</option>
                        <option value="20">20 items</option>
                        <option value="50">50 items</option>
                        <option value="100">100 items</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="btn-primary flex items-center gap-2" onClick={handleSavePreferences}>
                    <Save size={16} /> Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
