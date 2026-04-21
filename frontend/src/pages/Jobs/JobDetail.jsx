import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, ArrowLeft, Upload, FileText, UserPlus, Sparkles } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState(new Set());

  useEffect(() => {
    fetchJobDetails();
    fetchCandidates();
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
      const res = await api.get(`candidates/?job_id=${id}`);
      setCandidates(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('job_id', id);
    formData.append('first_name', file.name.replace('.pdf', '').split(' ')[0] || 'Unknown');
    formData.append('last_name', file.name.replace('.pdf', '').split(' ')[1] || 'Candidate');

    try {
      const res = await api.post('candidates/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCandidates([res.data, ...candidates]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

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
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Candidates Panel */}
        <div className="col-span-2 flex flex-col bg-surface-container-low rounded-2xl border border-[rgba(73,69,79,0.15)] overflow-hidden">
          <div className="p-4 border-b border-[rgba(73,69,79,0.15)] flex justify-between items-center bg-surface-container">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <UserPlus size={18} className="text-primary" />
              Talent Pool <span className="bg-surface-container-highest text-on-surface-variant text-xs px-2 py-0.5 rounded-full">{candidates.length}</span>
            </h2>
            <Link to={`/pipeline?job=${id}`} className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider">Open Kanban</Link>
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
                {candidates.map(cand => (
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
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {cand.ai_score !== null && cand.ai_score !== undefined ? (
                        <div className="flex items-center gap-3">
                           <div className="cursor-pointer hover:scale-105 transition-transform" onClick={() => window.location.href=`/candidates/${cand.id}`}>
                             <ScoreRing score={cand.ai_score} size={40} strokeWidth={4} />
                           </div>
                           <button 
                             onClick={() => handleAnalyze(cand.id)}
                             disabled={analyzingIds.has(cand.id)}
                             className="text-on-surface-variant hover:text-primary transition-colors"
                             title="Re-analyze"
                           >
                             {analyzingIds.has(cand.id) ? (
                               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <Sparkles size={16} />
                             )}
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
                          {analyzingIds.has(cand.id) ? 'Analyzing...' : 'Run ATS Scan'}
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
             <input type="file" id="resume-upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
             <div className="flex justify-center mb-4 text-primary">
               {uploading ? (
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               ) : (
                 <Upload size={32} />
               )}
             </div>
             <h3 className="font-semibold mb-2">{uploading ? 'Processing PDF...' : 'Upload Resumes'}</h3>
             <p className="text-xs text-on-surface-variant mb-4">Drag and drop PDFs, or browse files.</p>
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
