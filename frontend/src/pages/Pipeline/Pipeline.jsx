import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const STAGES = [
  { id: 'new', label: 'New Applicants', color: 'border-l-status-info' },
  { id: 'review', label: 'Under Review', color: 'border-l-status-warning' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'border-l-tertiary' },
  { id: 'interview', label: 'Interviewing', color: 'border-l-primary' },
  { id: 'on_hold', label: 'On Hold', color: 'border-l-on-surface-variant' },
  { id: 'offer', label: 'Offer Stage', color: 'border-l-status-success' },
  { id: 'rejected', label: 'Rejected', color: 'border-l-status-error' }
];

const Pipeline = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job');
  
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedCandId, setDraggedCandId] = useState(null);
  const [allJobs, setAllJobs] = useState([]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchCandidates();
    } else {
      // No job selected — fetch all jobs so user can pick one
      fetchAllJobs();
    }
  }, [jobId]);

  const fetchAllJobs = async () => {
    try {
      const res = await api.get('jobs/');
      setAllJobs(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`jobs/${jobId}/`);
      setJob(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await api.get(`candidates/?job_id=${jobId}`);
      setCandidates(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, id) => {
    setDraggedCandId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag ghost to generate before we might style the original differently
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50');
    setDraggedCandId(null);
    document.querySelectorAll('.kanban-col').forEach(el => el.classList.remove('bg-surface-container-high'));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e, stageId) => {
    if (e.currentTarget.classList.contains('kanban-col')) {
       e.currentTarget.classList.add('bg-surface-container-high');
    }
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget.classList.contains('kanban-col')) {
       e.currentTarget.classList.remove('bg-surface-container-high');
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains('kanban-col')) {
       e.currentTarget.classList.remove('bg-surface-container-high');
    }

    if (!draggedCandId) return;

    // Optimistic update
    const previousCandidates = [...candidates];
    setCandidates(candidates.map(cand => {
      if (cand.id === draggedCandId) {
        return { ...cand, status: targetStageId };
      }
      return cand;
    }));

    // API Call
    try {
      await api.put(`candidates/${draggedCandId}/status/`, { status: targetStageId });
    } catch (error) {
      console.error("Failed to update status", error);
      // Revert on failure
      setCandidates(previousCandidates);
      alert("Failed to move candidate.");
    }
  };

  if (loading) return <div className="p-8 relative z-10">Loading pipeline...</div>;
  
  // No job selected — show job picker
  if (!jobId) {
    return (
      <div className="space-y-6 animate-fade-in relative overflow-hidden">
        <div className="absolute top-[-100px] right-[-100px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[150px] opacity-5 pointer-events-none"></div>
        <header className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Talent Flow</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Select a job to manage its hiring pipeline.</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {allJobs.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-on-surface-variant">
              <GitMerge size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">No Jobs Yet</p>
              <p className="text-sm mb-6">Create a job first, then come back to manage its pipeline.</p>
              <Link to="/jobs" className="btn-primary">Go to Jobs</Link>
            </div>
          ) : (
            allJobs.map(j => (
              <Link 
                to={`/pipeline?job=${j.id}`} 
                key={j.id}
                className="card glass-card hover:border-primary/30 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{j.title}</h3>
                    <p className="text-xs text-on-surface-variant">{j.department} • {j.location}</p>
                  </div>
                </div>
                <div className="text-xs text-primary font-semibold mt-2">Open Talent Flow →</div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }
  
  if (!job) return <div className="p-8 relative z-10">Please select a job to view its pipeline.</div>;

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col relative z-10">
      
      {/* Background decoration */}
      <div className="absolute top-[-100px] right-[-100px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[150px] opacity-5 pointer-events-none"></div>

      <header className="flex items-start gap-4 flex-shrink-0">
        <Link to={`/jobs/${job.id}`} className="mt-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Talent Flow</h1>
          <div className="flex items-center gap-3 text-on-surface-variant text-sm mt-1">
             <span className="font-semibold text-primary">{job.title}</span>
             <span className="w-1 h-1 rounded-full bg-on-surface-variant/40"></span>
             <span className="flex items-center gap-1"><Building2 size={14} /> {job.department}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">Compare Candidates</button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex gap-4 flex-1 overflow-x-auto pb-4 pt-2">
        {STAGES.map(stage => {
          const stageCandidates = candidates.filter(c => c.status === stage.id);
          
          return (
            <div 
              key={stage.id} 
              className={`kanban-col min-w-[300px] w-[300px] flex flex-col bg-surface-container-low rounded-2xl border border-[rgba(73,69,79,0.15)] transition-colors`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`p-4 border-b border-[rgba(73,69,79,0.15)] flex items-center justify-between border-l-4 rounded-tl-2xl ${stage.color}`}>
                <h3 className="font-semibold text-sm uppercase tracking-wider">{stage.label}</h3>
                <span className="bg-surface-container-high text-xs px-2 py-0.5 rounded-full font-bold">{stageCandidates.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {stageCandidates.map(cand => (
                  <div 
                    key={cand.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, cand.id)}
                    onDragEnd={handleDragEnd}
                    className="card glass-card hover:border-primary/40 cursor-grab active:cursor-grabbing p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <Link to={`/candidates/${cand.id}`} className="font-bold text-on-surface hover:text-primary transition-colors block leading-tight">
                         {cand.first_name} {cand.last_name}
                       </Link>
                       {cand.ats_score && (
                         <div className="flex-shrink-0 scale-75 origin-top-right -mt-1 -mr-1">
                           <ScoreRing score={cand.ats_score} size={40} strokeWidth={5} />
                         </div>
                       )}
                    </div>
                    
                    <div className="text-xs text-on-surface-variant mb-3 flex items-center gap-1">
                       <MapPin size={12} />
                       {cand.location || "Location unlisted"}
                    </div>
                    
                    {cand.ai_explanation && (
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 bg-surface-container-low p-2 rounded relative before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:bg-primary/30 pl-3">
                        "{cand.ai_explanation}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pipeline;
