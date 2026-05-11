import React, { useState, useEffect } from 'react';
import { GitCompare, ChevronRight, X, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';
import StatusBadge from '../../components/shared/StatusBadge';
import Skeleton from '../../components/shared/Skeleton';

const STEPS = [
  { id: 1, label: 'Select Job' },
  { id: 2, label: 'Pick Candidates' },
  { id: 3, label: 'Results' },
];

const Compare = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.get('jobs/').then(res => { setJobs(res.data.results || res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedJob) {
      api.get(`candidates/?job_id=${selectedJob}`).then(res => {
        const data = res.data.results || res.data;
        setCandidates(data.filter(c => c.ats_score != null));
        setCompareIds([]);
        setCompareData([]);
      });
    }
  }, [selectedJob]);

  const toggleCandidate = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const removeCandidate = (id) => {
    setCompareIds(prev => prev.filter(x => x !== id));
  };

  const runCompare = async () => {
    setComparing(true);
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
    setComparing(false);
    setStep(3);
  };

  const handleSelectJob = (jobId) => {
    setSelectedJob(jobId);
    setStep(2);
  };

  const handleBack = () => {
    if (step === 3) { setStep(2); setCompareData([]); }
    else if (step === 2) { setStep(1); setSelectedJob(null); setCandidates([]); setCompareIds([]); }
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  if (loading) return <Skeleton.PageSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      <header className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
          <GitCompare size={28} className="text-primary" /> Compare Candidates
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Follow the steps to compare candidates side-by-side.
        </p>
      </header>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 relative z-10">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              step === s.id ? 'bg-primary/20 text-primary border border-primary/30' :
              step > s.id ? 'bg-status-success/10 text-status-success' :
              'bg-surface-container text-on-surface-variant'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s.id ? 'bg-primary text-on-primary' :
                step > s.id ? 'bg-status-success text-on-primary' :
                'bg-surface-container-highest text-on-surface-variant'
              }`}>
                {step > s.id ? '✓' : s.id}
              </div>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={14} className="text-on-surface-variant/30 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Back Button */}
      {step > 1 && (
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors relative z-10">
          <ArrowLeft size={16} /> Back to {step === 3 ? 'candidate selection' : 'job selection'}
        </button>
      )}

      {/* STEP 1: Select Job */}
      {step === 1 && (
        <div className="relative z-10 animate-fade-in">
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Choose a job to compare candidates from</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {jobs.map(job => (
              <button
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                className="p-4 rounded-xl border border-[rgba(73,69,79,0.15)] bg-surface-container hover:border-primary/30 text-left transition-all hover:shadow-lg hover:shadow-primary/5 group"
              >
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{job.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1">{job.department} • {job.location}</p>
                <p className="text-xs text-primary mt-2">{job.candidates_count ?? 0} candidates</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Pick Candidates */}
      {step === 2 && (
        <div className="relative z-10 space-y-4 animate-fade-in">
          {/* Selected Job Info */}
          {selectedJobData && (
            <div className="card bg-surface-container-low p-3 flex items-center gap-3 border border-primary/20">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CheckCircle size={16} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{selectedJobData.title}</p>
                <p className="text-[10px] text-on-surface-variant">{selectedJobData.department} • {selectedJobData.location}</p>
              </div>
            </div>
          )}

          {/* Selected Candidate Chips */}
          {compareIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {compareIds.map(cid => {
                const c = candidates.find(x => x.id === cid);
                if (!c) return null;
                return (
                  <div key={cid} className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full pl-3 pr-1.5 py-1">
                    <div className="w-5 h-5 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-[9px] font-bold">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <span className="text-xs font-medium text-primary">{c.first_name} {c.last_name}</span>
                    <span className="text-[10px] text-on-surface-variant">({c.ats_score})</span>
                    <button
                      onClick={() => removeCandidate(cid)}
                      className="w-5 h-5 rounded-full hover:bg-status-error/20 flex items-center justify-center text-on-surface-variant hover:text-status-error transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Select Candidates ({compareIds.length}/4)
            </label>
            {compareIds.length >= 2 && (
              <button onClick={runCompare} disabled={comparing} className="btn-primary py-1.5 px-4 text-sm flex items-center gap-2">
                {comparing ? (
                  <><div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div> Comparing...</>
                ) : (
                  <>Compare {compareIds.length} Candidates <ChevronRight size={14} /></>
                )}
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
      )}

      {/* STEP 3: Results */}
      {step === 3 && compareData.length >= 2 && (
        <div className="relative z-10 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Comparison Results</h2>
            <button onClick={() => { setCompareData([]); setStep(2); }} className="text-on-surface-variant hover:text-on-surface text-xs flex items-center gap-1">
              <X size={14} /> Start Over
            </button>
          </div>

          {/* Best candidate highlight */}
          {(() => {
            const best = [...compareData].sort((a, b) => (b.evaluation?.overall_score || 0) - (a.evaluation?.overall_score || 0))[0];
            return best?.evaluation?.overall_score > 0 && (
              <div className="card bg-status-success/5 border border-status-success/20 p-3 mb-4 flex items-center gap-3">
                <CheckCircle size={18} className="text-status-success" />
                <span className="text-sm font-semibold text-status-success">
                  Top Match: {best.first_name} {best.last_name} ({best.evaluation.overall_score}/100)
                </span>
              </div>
            );
          })()}

          <div className={`grid gap-4 ${compareData.length === 2 ? 'grid-cols-2' : compareData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {compareData.map(c => {
              const ev = c.evaluation;
              const bestScore = Math.max(...compareData.map(d => d.evaluation?.overall_score || 0));
              const isBest = ev?.overall_score === bestScore;
              return (
                <div key={c.id} className={`card glass-card-elevated p-5 space-y-4 ${isBest ? 'ring-2 ring-status-success/30' : ''}`}>
                  {isBest && (
                    <div className="text-[9px] font-bold uppercase tracking-wider text-status-success bg-status-success/10 px-2 py-0.5 rounded-full self-start inline-block">⭐ Best Match</div>
                  )}
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-lg font-bold shadow-lg">
                      {c.first_name[0]}{c.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold">{c.first_name} {c.last_name}</h3>
                      <p className="text-xs text-on-surface-variant">{c.email}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex justify-center py-2">
                    <ScoreRing score={ev?.overall_score || 0} size={100} strokeWidth={8} />
                  </div>

                  {/* Confidence & Status */}
                  <div className="flex justify-center gap-2">
                    {ev?.confidence && <StatusBadge status={ev.confidence} size="xs" />}
                    <StatusBadge status={c.status} size="xs" />
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
    </div>
  );
};

export default Compare;
