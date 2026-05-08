import React, { useState, useEffect } from 'react';
import { GitCompare, ChevronDown, X } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const Compare = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('jobs/').then(res => { setJobs(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedJob) {
      api.get(`candidates/?job_id=${selectedJob}`).then(res => {
        setCandidates(res.data.filter(c => c.ats_score != null));
        setCompareIds([]);
        setCompareData([]);
      });
    }
  }, [selectedJob]);

  const toggleCandidate = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const runCompare = async () => {
    const data = [];
    for (const cid of compareIds) {
      try {
        const [candRes, evalRes] = await Promise.all([
          api.get(`candidates/${cid}/`),
          api.get('analysis/')
        ]);
        const ev = evalRes.data.find(e => e.candidate === parseInt(cid) || e.candidate === cid);
        data.push({ ...candRes.data, evaluation: ev });
      } catch (err) { console.error(err); }
    }
    setCompareData(data);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      <header className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
          <GitCompare size={28} className="text-primary" /> Compare Candidates
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Select a job and pick candidates to compare side-by-side.
        </p>
      </header>

      {/* Job Selector */}
      <div className="relative z-10">
        <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Select Job</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {jobs.map(job => (
            <button
              key={job.id}
              onClick={() => setSelectedJob(job.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedJob === job.id
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                  : 'border-[rgba(73,69,79,0.15)] bg-surface-container hover:border-primary/30'
              }`}
            >
              <h3 className="font-semibold text-sm">{job.title}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{job.department} • {job.location}</p>
              <p className="text-xs text-primary mt-2">{job.candidates_count ?? 0} candidates</p>
            </button>
          ))}
        </div>
      </div>

      {selectedJob && (
        <>
          {/* Candidate Selector */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Select Candidates ({compareIds.length}/4)
              </label>
              {compareIds.length >= 2 && (
                <button onClick={runCompare} className="btn-primary py-1.5 px-4 text-sm">
                  Compare {compareIds.length} Candidates
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleCandidate(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                    compareIds.includes(c.id)
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-[rgba(73,69,79,0.15)] bg-surface-container hover:border-primary/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.first_name} {c.last_name}</p>
                    <p className="text-[10px] text-on-surface-variant">Score: {c.ats_score}</p>
                  </div>
                  {compareIds.includes(c.id) && (
                    <div className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                  )}
                </button>
              ))}
              {candidates.length === 0 && (
                <p className="col-span-full text-sm text-on-surface-variant text-center py-8">No scored candidates for this job. Run ATS scan first.</p>
              )}
            </div>
          </div>

          {/* Comparison Results */}
          {compareData.length >= 2 && (
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Comparison Results</h2>
                <button onClick={() => setCompareData([])} className="text-on-surface-variant hover:text-on-surface text-xs flex items-center gap-1">
                  <X size={14} /> Clear
                </button>
              </div>
              <div className={`grid gap-4 ${compareData.length === 2 ? 'grid-cols-2' : compareData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {compareData.map(c => {
                  const ev = c.evaluation;
                  return (
                    <div key={c.id} className="card glass-card-elevated p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-lg font-bold shadow-lg">
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <h3 className="font-bold">{c.first_name} {c.last_name}</h3>
                          <p className="text-xs text-on-surface-variant">{c.email}</p>
                          {c.phone && <p className="text-xs text-on-surface-variant">{c.phone}</p>}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex justify-center py-2">
                        <ScoreRing score={ev?.overall_score || 0} size={100} strokeWidth={8} />
                      </div>

                      {/* Confidence */}
                      {ev?.confidence && (
                        <div className="text-center">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            ev.confidence === 'high' ? 'bg-status-success/20 text-status-success' :
                            ev.confidence === 'medium' ? 'bg-status-warning/20 text-status-warning' :
                            'bg-status-error/20 text-status-error'
                          }`}>{ev.confidence} confidence</span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="text-center">
                        <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded ${
                          c.status === 'shortlisted' ? 'bg-status-success/15 text-status-success' :
                          c.status === 'rejected' ? 'bg-status-error/15 text-status-error' :
                          c.status === 'interview' ? 'bg-primary/15 text-primary' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>{c.status}</span>
                      </div>

                      {/* Strengths */}
                      <div>
                        <h4 className="text-[10px] uppercase font-semibold text-status-success mb-2 tracking-wider">Strengths</h4>
                        <ul className="text-xs text-on-surface-variant space-y-1">
                          {(ev?.strengths || []).slice(0, 5).map((s, i) => (
                            <li key={i} className="flex gap-1.5"><span className="text-status-success/60 mt-0.5">•</span>{s}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div>
                        <h4 className="text-[10px] uppercase font-semibold text-status-warning mb-2 tracking-wider">Gaps</h4>
                        <ul className="text-xs text-on-surface-variant space-y-1">
                          {(ev?.weaknesses || []).slice(0, 5).map((w, i) => (
                            <li key={i} className="flex gap-1.5"><span className="text-status-warning/60 mt-0.5">•</span>{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Compare;
