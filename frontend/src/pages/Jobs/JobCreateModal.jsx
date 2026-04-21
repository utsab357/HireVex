import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import api from '../../api/client';

const JobCreateModal = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    min_experience: 0,
    max_experience: '',
    education_level: '',
    internship_policy: 'half'
  });
  
  const [requirements, setRequirements] = useState([
    { skill_name: '', importance: 3, is_must_have: false }
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Filter out empty requirements
      const validReqs = requirements.filter(req => req.skill_name.trim() !== '');
      const payload = {
        ...formData,
        requirements: validReqs
      };
      const response = await api.post('jobs/', payload);
      onCreated(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, { skill_name: '', importance: 3, is_must_have: false }]);
  };

  const updateRequirement = (index, field, value) => {
    const updated = [...requirements];
    updated[index][field] = value;
    setRequirements(updated);
  };

  const removeRequirement = (index) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const [detectedSkills, setDetectedSkills] = useState([]);

  const handleDescriptionBlur = useCallback(async () => {
    const desc = formData.description.trim();
    if (desc.length < 20) return;
    try {
      const response = await api.post('jobs/extract-skills/', { description: desc });
      const skills = response.data.skills || [];
      // Filter out skills already in requirements
      const existingSkills = requirements.map(r => r.skill_name.toLowerCase());
      const newSkills = skills.filter(s => !existingSkills.includes(s.toLowerCase()));
      setDetectedSkills(newSkills);
    } catch (e) {
      console.error('Skill detection failed:', e);
    }
  }, [formData.description, requirements]);

  const addDetectedSkills = () => {
    const newReqs = detectedSkills.map(skill => ({
      skill_name: skill,
      importance: 3,
      is_must_have: false
    }));
    setRequirements([...requirements.filter(r => r.skill_name.trim() !== ''), ...newReqs]);
    setDetectedSkills([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-surface-container-low border border-[rgba(73,69,79,0.15)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <header className="px-6 py-4 border-b border-[rgba(73,69,79,0.15)] flex items-center justify-between">
          <h2 className="text-xl font-bold">Create New Job</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Job Title</label>
              <input required type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Department</label>
              <input required type="text" className="input-field" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Engineering" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Location</label>
              <input required type="text" className="input-field" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Remote / New York" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Description</label>
              <textarea required className="input-field min-h-[100px] py-3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} onBlur={handleDescriptionBlur} placeholder="Paste the job description here... Skills will be auto-detected."></textarea>
            </div>
          </div>
          
          <div className="border-t border-[rgba(73,69,79,0.15)] pt-6">
            <h3 className="font-semibold text-on-surface mb-4">Job Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Min Experience</label>
                <select className="input-field" value={formData.min_experience} onChange={e => setFormData({...formData, min_experience: parseInt(e.target.value)})}>
                  {[...Array(16)].map((_, i) => <option key={i} value={i}>{i} Years</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Max Experience (Optional)</label>
                <select className="input-field" value={formData.max_experience} onChange={e => setFormData({...formData, max_experience: e.target.value ? parseInt(e.target.value) : ''})}>
                  <option value="">No Maximum</option>
                  {[...Array(16)].map((_, i) => <option key={i} value={i}>{i} Years</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Education Level</label>
                <select className="input-field" value={formData.education_level} onChange={e => setFormData({...formData, education_level: e.target.value})}>
                  <option value="">No requirement</option>
                  <option value="any">Any degree</option>
                  <option value="bachelors">Bachelor's degree</option>
                  <option value="masters">Master's degree</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Internship Policy</label>
                <select className="input-field" value={formData.internship_policy} onChange={e => setFormData({...formData, internship_policy: e.target.value})}>
                  <option value="full">Count Full (1x)</option>
                  <option value="half">Count Half (0.5x)</option>
                  <option value="ignore">Ignore</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-[rgba(73,69,79,0.15)] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-on-surface">Scoring Requirements</h3>
              <p className="text-xs text-on-surface-variant">These help ATS score candidates</p>
            </div>

            {detectedSkills.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface mb-1">Detected Skills</p>
                  <p className="text-xs text-on-surface-variant mb-2">
                    {detectedSkills.join(', ')}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={addDetectedSkills} className="text-xs font-semibold text-primary hover:underline">+ Add All</button>
                    <button type="button" onClick={() => setDetectedSkills([])} className="text-xs font-semibold text-on-surface-variant hover:underline">Dismiss</button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {requirements.map((req, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-surface-container rounded-xl p-2 pr-4 border border-[rgba(73,69,79,0.1)]">
                  <input 
                    type="text" 
                    placeholder="e.g. React.js" 
                    className="input-field bg-transparent border-none flex-1 py-2"
                    value={req.skill_name}
                    onChange={(e) => updateRequirement(idx, 'skill_name', e.target.value)}
                  />
                  
                  <div className="flex items-center gap-2 border-l border-[rgba(73,69,79,0.15)] pl-4">
                    <span className="text-[10px] uppercase text-on-surface-variant font-semibold">Weight:</span>
                    <select 
                      className="bg-surface-container-high border-none rounded text-sm px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                      value={req.importance}
                      onChange={(e) => updateRequirement(idx, 'importance', parseInt(e.target.value))}
                    >
                      <option value={1}>1 - Nice to Have</option>
                      <option value={2}>2 - Preferred</option>
                      <option value={3}>3 - Important</option>
                      <option value={4}>4 - Very Important</option>
                      <option value={5}>5 - Critical</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 border-l border-[rgba(73,69,79,0.15)] pl-4 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-primary"
                      checked={req.is_must_have}
                      onChange={(e) => updateRequirement(idx, 'is_must_have', e.target.checked)}
                    />
                    <span className="text-[10px] uppercase font-semibold text-on-surface-variant">Must Have</span>
                  </label>

                  {requirements.length > 1 && (
                    <button type="button" onClick={() => removeRequirement(idx)} className="text-status-error/70 hover:text-status-error ml-2 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              <button type="button" onClick={addRequirement} className="text-primary text-sm font-medium flex items-center gap-1 mt-2 hover:underline">
                <Plus size={16} /> Add Another Skill
              </button>
            </div>
          </div>
        </form>

        <footer className="px-6 py-4 border-t border-[rgba(73,69,79,0.15)] flex justify-end gap-3 bg-surface-container">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Job'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default JobCreateModal;
