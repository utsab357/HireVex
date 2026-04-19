import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import api from '../../api/client';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ 
    full_name: '', 
    email: '', 
    password: '',
    role: 'hr' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('auth/register/', formData);
      login(res.data.user, res.data.tokens);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden py-12">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="card glass-card-elevated w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Hirevex</h1>
          <p className="text-on-surface-variant text-sm">Create your intelligent hiring hub</p>
        </div>

        {error && (
          <div className="bg-status-error/10 text-status-error p-3 rounded-xl text-sm mb-6 border border-status-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text" 
              required
              className="input-field" 
              placeholder="Jane Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Email</label>
            <input 
              type="email" 
              required
              className="input-field" 
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              className="input-field" 
              placeholder="••••••••"
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <div>
             <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">I am a...</label>
             <div className="flex gap-4">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="role" value="hr" checked={formData.role === 'hr'} onChange={() => setFormData({...formData, role: 'hr'})} className="accent-primary" />
                 <span className="text-sm text-on-surface">Recruiter / HR</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="role" value="candidate" checked={formData.role === 'candidate'} onChange={() => setFormData({...formData, role: 'candidate'})} className="accent-primary" />
                 <span className="text-sm text-on-surface">Candidate</span>
               </label>
             </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 flex justify-center">
            {loading ? 'Creating...' : 'Initialize Hub'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-on-surface-variant">
          Already have access? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
