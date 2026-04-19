import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';

const JobCreateModal = ({ onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
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
              <textarea required className="input-field min-h-[100px] py-3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Brief description of the role..."></textarea>
            </div>
          </div>

          <div className="border-t border-[rgba(73,69,79,0.15)] pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-on-surface">Scoring Requirements</h3>
              <p className="text-xs text-on-surface-variant">These help AI score candidates</p>
            </div>

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
                      <option value={1}>1 - Nice to have</option>
                      <option value={2}>2</option>
                      <option value={3}>3 - Important</option>
                      <option value={4}>4</option>
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
