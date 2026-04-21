import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft, Upload, FileText, UserPlus, Sparkles, AlertTriangle, ArrowDownAZ, ArrowDown01, Clock, Zap, Pencil } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [bulkProgress, setBulkProgress] = useState(null);
  const [scanAllRunning, setScanAllRunning] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState(new Set());
  const [insight, setInsight] = useState(null);
  const [editingJob, setEditingJob] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchJobDetails();
    fetchCandidates();
    fetchInsight();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`jobs/${id}/`);
      setJob(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const [candRes, evalRes] = await Promise.all([
        api.get(`candidates/?job_id=${id}`),
        api.get(`analysis/`)
      ]);
      // Merge evaluation data (needs_review, confidence) into candidates
      const evals = evalRes.data || [];
      const enriched = candRes.data.map(cand => {
        const ev = evals.find(e => e.candidate === cand.id);
        return {
          ...cand,
          needs_review: ev?.needs_review || false,
          review_reason: ev?.review_reason || '',
          confidence: ev?.confidence || null,
        };
      });
      setCandidates(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsight = async () => {
    try {
      const res = await api.get(`analysis/insights/${id}/`);
      setInsight(res.data.insight);
    } catch (e) {
      // Insight is optional, don't block
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleBulkUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleBulkUpload(Array.from(e.target.files));
    }
  };

  const handleBulkUpload = async (files) => {
    const validFiles = files.filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.pdf') || name.endsWith('.docx');
    });

    if (validFiles.length === 0) {
      alert('Please upload PDF or DOCX files.');
      return;
    }

    setUploading(true);
    const results = [];

    for (let i = 0; i < validFiles.length; i++) {
      setBulkProgress({ current: i + 1, total: validFiles.length });
      const formData = new FormData();
      formData.append('file', validFiles[i]);
      formData.append('job_id', id);
      // Name extraction happens server-side (Phase 5)
      try {
        const res = await api.post('candidates/upload/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        results.push(res.data);
      } catch (err) {
        console.error(`Upload failed for ${validFiles[i].name}`, err);
      }
    }

    setCandidates(prev => [...results, ...prev]);
    setUploading(false);
    setBulkProgress(null);
  };

  const handleScanAll = async () => {
    const unscanned = candidates.filter(c => c.ai_score === null || c.ai_score === undefined);
    if (unscanned.length === 0) return;
    setScanAllRunning(true);
    for (const cand of unscanned) {
      await handleAnalyze(cand.id);
    }
    setScanAllRunning(false);
    await fetchCandidates();
  };

  const handleRescanAll = async () => {
    if (candidates.length === 0) return;
    setScanAllRunning(true);
    for (const cand of candidates) {
      await handleAnalyze(cand.id);
    }
    setScanAllRunning(false);
    await fetchCandidates();
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'score') return (b.ai_score ?? -1) - (a.ai_score ?? -1);
    if (sortBy === 'name') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    if (sortBy === 'date') return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  const handleAnalyze = async (candidateId) => {
    setAnalyzingIds(prev => new Set(prev).add(candidateId));
    try {
      const res = await api.post(`analysis/evaluate/${candidateId}/`);
      // Update candidate in the list
      setCandidates(candidates.map(cand => {
        if (cand.id === candidateId) {
          return {
            ...cand,
            ai_score: res.data.overall_score,
            ai_explanation: res.data.explanation,
            status: 'review'
          };
        }
        return cand;
      }));
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(candidateId);
        return newSet;
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Link to="/jobs" className="mt-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-on-surface">{job.title}</h1>
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${job.status === 'active' ? 'bg-status-success/10 text-status-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
              {job.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant text-sm mt-2">
            <div className="flex items-center gap-1"><Building2 size={16} /> {job.department}</div>
            <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
            <div className="flex items-center gap-1"><MapPin size={16} /> {job.location}</div>
            <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
            <button 
              onClick={() => { setEditForm({ title: job.title, department: job.department, location: job.location, description: job.description, status: job.status, requirements: job.requirements.map(r => ({skill_name: r.skill_name, importance: r.importance, is_must_have: r.is_must_have})) }); setEditingJob(true); }}
              className="flex items-center gap-1 text-primary hover:underline font-medium"
            >
              <Pencil size={14} /> Edit Job
            </button>
          </div>
        </div>
      </header>

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm animate-fade-in p-4" onClick={() => setEditingJob(false)}>
          <div className="bg-surface-container-low border border-[rgba(73,69,79,0.15)] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[rgba(73,69,79,0.15)]">
              <h2 className="text-xl font-bold">Edit Job</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Title</label>
                <input type="text" className="input-field" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Department</label>
                  <input type="text" className="input-field" value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Location</label>
                  <input type="text" className="input-field" value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Description</label>
                <textarea className="input-field min-h-[80px] py-2" value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Status</label>
                <select className="input-field" value={editForm.status || 'active'} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Skill requirements section */}
              <div className="border-t border-[rgba(73,69,79,0.15)] pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-3">Scoring Requirements</h3>
                <div className="space-y-2">
                  {(editForm.requirements || []).map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface-container rounded-xl p-2 border border-[rgba(73,69,79,0.1)]">
                      <input 
                        type="text" placeholder="e.g. React" 
                        className="input-field bg-transparent border-none flex-1 py-1 text-sm"
                        value={req.skill_name}
                        onChange={e => {
                          const updated = [...editForm.requirements];
                          updated[idx] = {...updated[idx], skill_name: e.target.value};
                          setEditForm({...editForm, requirements: updated});
                        }}
                      />
                      <select 
                        className="bg-surface-container-high border-none rounded text-xs px-2 py-1"
                        value={req.importance}
                        onChange={e => {
                          const updated = [...editForm.requirements];
                          updated[idx] = {...updated[idx], importance: parseInt(e.target.value)};
                          setEditForm({...editForm, requirements: updated});
                        }}
                      >
                        <option value={1}>W1</option>
                        <option value={2}>W2</option>
                        <option value={3}>W3</option>
                        <option value={4}>W4</option>
                        <option value={5}>W5</option>
                      </select>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" className="w-3.5 h-3.5 accent-primary"
                          checked={req.is_must_have}
                          onChange={e => {
                            const updated = [...editForm.requirements];
                            updated[idx] = {...updated[idx], is_must_have: e.target.checked};
                            setEditForm({...editForm, requirements: updated});
                          }}
                        />
                        <span className="text-[10px] uppercase font-semibold text-on-surface-variant">Must</span>
                      </label>
                      <button onClick={() => {
                        const updated = editForm.requirements.filter((_, i) => i !== idx);
                        setEditForm({...editForm, requirements: updated});
                      }} className="text-status-error/70 hover:text-status-error p-1 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => {
                  setEditForm({...editForm, requirements: [...(editForm.requirements || []), { skill_name: '', importance: 3, is_must_have: false }]});
                }} className="text-primary text-xs font-medium flex items-center gap-1 mt-2 hover:underline">
                  + Add Skill
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(73,69,79,0.15)] flex justify-end gap-3">
              <button onClick={() => setEditingJob(false)} className="btn-ghost">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    const payload = {
                      title: editForm.title,
                      department: editForm.department,
                      location: editForm.location,
                      description: editForm.description,
                      status: editForm.status,
                      requirements: (editForm.requirements || []).filter(r => r.skill_name.trim()).map(r => ({
                        skill_name: r.skill_name,
                        importance: r.importance,
                        is_must_have: r.is_must_have
                      }))
                    };
                    const res = await api.put(`jobs/${id}/`, payload);
                    setJob(res.data);
                    setEditingJob(false);
                  } catch (e) { console.error('Update failed', e); alert('Failed to update job.'); }
                }}
                className="btn-primary"
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Candidates Panel */}
        <div className="col-span-2 flex flex-col bg-surface-container-low rounded-2xl border border-[rgba(73,69,79,0.15)] overflow-hidden">
          <div className="p-4 border-b border-[rgba(73,69,79,0.15)] bg-surface-container">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <UserPlus size={18} className="text-primary" />
                Talent Pool <span className="bg-surface-container-highest text-on-surface-variant text-xs px-2 py-0.5 rounded-full">{candidates.length}</span>
              </h2>
              {insight && (
                <p className="text-[11px] text-on-surface-variant italic">💡 {insight}</p>
              )}
              <div className="flex items-center gap-2">
                {candidates.some(c => c.ai_score === null || c.ai_score === undefined) && (
                  <button onClick={handleScanAll} disabled={scanAllRunning} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5">
                    <Zap size={12} />
                    {scanAllRunning ? 'Scanning...' : 'Scan All'}
                  </button>
                )}
                {candidates.some(c => c.ai_score !== null && c.ai_score !== undefined) && (
                  <button onClick={handleRescanAll} disabled={scanAllRunning} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1.5">
                    <Sparkles size={12} />
                    {scanAllRunning ? 'Rescanning...' : 'Rescan All'}
                  </button>
                )}
                <Link to={`/pipeline?job=${id}`} className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider">Open Kanban</Link>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold mr-1">Sort:</span>
              {[
                { key: 'score', label: 'Score', icon: ArrowDown01 },
                { key: 'name', label: 'Name', icon: ArrowDownAZ },
                { key: 'date', label: 'Date', icon: Clock },
              ].map(s => (
                <button key={s.key} onClick={() => setSortBy(s.key)} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${sortBy === s.key ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                  <s.icon size={10} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {candidates.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                 <FileText size={48} className="mb-4 text-on-surface-variant" />
                 <p>No candidates yet.</p>
                 <p className="text-sm">Upload a resume to get started.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {sortedCandidates.map(cand => (
                  <div key={cand.id} className="flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition rounded-xl border border-[rgba(73,69,79,0.1)] group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center font-bold">
                        {cand.first_name[0]}{cand.last_name[0]}
                      </div>
                      <div>
                        {/* Make the candidate name clickable to go to the insight panel */}
                        <Link to={`/candidates/${cand.id}`} className="font-semibold text-on-surface text-sm hover:text-primary transition-colors block">
                          {cand.first_name} {cand.last_name}
                        </Link>
                        <p className="text-xs text-on-surface-variant">{cand.email}</p>
                        {cand.needs_review && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-warning bg-status-warning/10 px-1.5 py-0.5 rounded-full mt-0.5" title={cand.review_reason}>
                            <AlertTriangle size={10} /> Review
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {cand.ai_score !== null && cand.ai_score !== undefined ? (
                        <div className="flex items-center gap-2">
                           <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => window.location.href=`/candidates/${cand.id}`}>
                             <ScoreRing score={cand.ai_score} size={40} strokeWidth={4} />
                           </div>
                           <button 
                             onClick={() => handleAnalyze(cand.id)}
                             disabled={analyzingIds.has(cand.id)}
                             className={`btn-secondary py-1 px-2.5 text-[10px] flex items-center gap-1 ${analyzingIds.has(cand.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                             title="Re-scan this candidate"
                           >
                             {analyzingIds.has(cand.id) ? (
                               <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <Sparkles size={12} />
                             )}
                             {analyzingIds.has(cand.id) ? 'Scanning...' : 'Rescan'}
                           </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAnalyze(cand.id)}
                          disabled={analyzingIds.has(cand.id)}
                          className={`btn-secondary py-1.5 px-3 text-xs flex items-center gap-2 ${analyzingIds.has(cand.id) ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {analyzingIds.has(cand.id) ? (
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Sparkles size={14} className="text-primary" />
                          )}
                          {analyzingIds.has(cand.id) ? 'Scanning...' : 'Run ATS Scan'}
                        </button>
                      )}
                      
                      <span className="text-[10px] uppercase font-bold px-2 py-1 bg-surface-container-highest rounded tracking-wider w-20 text-center">{cand.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upload & Details Panel */}
        <div className="col-span-1 space-y-6 flex flex-col">
          {/* Upload Zone */}
          <div 
            className={`card flex-shrink-0 border-2 border-dashed transition-all p-6 text-center
              ${dragActive ? 'border-primary bg-primary/5' : 'border-[rgba(73,69,79,0.3)] bg-surface-container-low'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
             <input type="file" id="resume-upload" className="hidden" accept=".pdf,.docx" multiple onChange={handleFileChange} />
             <div className="flex justify-center mb-4 text-primary">
               {uploading ? (
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <Upload size={32} />
               )}
             </div>
             <h3 className="font-semibold mb-2">
               {uploading && bulkProgress
                 ? `Uploading ${bulkProgress.current} of ${bulkProgress.total}...`
                 : uploading ? 'Processing...' : 'Upload Resumes'}
             </h3>
             <p className="text-xs text-on-surface-variant mb-4">Drag and drop PDF or DOCX, or browse files.</p>
             <label htmlFor="resume-upload" className="btn-secondary text-sm py-2 px-4 cursor-pointer inline-block">
               Browse Files
             </label>
          </div>

          {/* Job Details */}
          <div className="card bg-surface-container flex-1 overflow-y-auto">
            <h3 className="font-semibold mb-3">Job Description</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
              {job.description}
            </p>
            
            <h3 className="font-semibold mb-3">Requirements Map</h3>
            <div className="space-y-2">
              {job.requirements.map(req => (
                <div key={req.id} className="flex items-center justify-between text-sm p-2 rounded bg-surface-container-high">
                  <span className="flex items-center gap-2">
                    {req.is_must_have && <span className="w-2 h-2 rounded-full bg-status-warning"></span>}
                    {req.skill_name}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-surface-container-highest rounded text-primary">W{req.importance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
