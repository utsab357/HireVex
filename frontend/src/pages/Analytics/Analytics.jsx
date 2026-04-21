import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, Briefcase, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const Analytics = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, candsRes] = await Promise.all([
          api.get('jobs/'),
          api.get('candidates/')
        ]);
        setJobs(jobsRes.data);
        setCandidates(candsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  const scored = candidates.filter(c => c.ai_score !== null && c.ai_score !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((s, c) => s + c.ai_score, 0) / scored.length) : 0;
  const topCandidates = [...scored].sort((a, b) => b.ai_score - a.ai_score).slice(0, 10);

  const ranges = [
    { label: '90-100', min: 90, max: 100, color: '#22c55e', bg: 'bg-[#22c55e]' },
    { label: '70-89', min: 70, max: 89, color: '#a3e635', bg: 'bg-[#a3e635]' },
    { label: '50-69', min: 50, max: 69, color: '#facc15', bg: 'bg-[#facc15]' },
    { label: '30-49', min: 30, max: 49, color: '#fb923c', bg: 'bg-[#fb923c]' },
    { label: '0-29', min: 0, max: 29, color: '#ef4444', bg: 'bg-[#ef4444]' },
  ];
  const distribution = ranges.map(r => ({
    ...r,
    count: scored.filter(c => c.ai_score >= r.min && c.ai_score <= r.max).length
  }));
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  const statuses = {};
  candidates.forEach(c => { statuses[c.status] = (statuses[c.status] || 0) + 1; });
  const statusColors = {
    new: '#8b8fa3', review: '#facc15', shortlisted: '#22c55e',
    interview: '#6366f1', on_hold: '#fb923c', rejected: '#ef4444', hired: '#06b6d4'
  };

  // Per-job stats
  const jobStats = jobs.map(job => {
    const jobCands = candidates.filter(c => c.job === job.id);
    const jobScored = jobCands.filter(c => c.ai_score != null);
    const jobAvg = jobScored.length ? Math.round(jobScored.reduce((s, c) => s + c.ai_score, 0) / jobScored.length) : 0;
    return { ...job, total: jobCands.length, scored: jobScored.length, avg: jobAvg };
  });

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      <header className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
          <BarChart3 size={28} className="text-primary" /> Analytics
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Talent pipeline insights across all jobs.
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
        <div className="card glass-card text-center">
          <Users size={24} className="text-primary mx-auto mb-2" />
          <div className="text-3xl font-bold">{candidates.length}</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Total Candidates</div>
        </div>
        <div className="card glass-card text-center">
          <Award size={24} className="text-status-success mx-auto mb-2" />
          <div className="text-3xl font-bold">{scored.length}</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Scored</div>
        </div>
        <div className="card glass-card text-center">
          <TrendingUp size={24} className="text-tertiary mx-auto mb-2" />
          <div className="text-3xl font-bold text-primary">{avg}</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Average Score</div>
        </div>
        <div className="card glass-card text-center">
          <Briefcase size={24} className="text-secondary mx-auto mb-2" />
          <div className="text-3xl font-bold">{jobs.length}</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">Active Jobs</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Score Distribution */}
        <div className="card glass-card-elevated col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {distribution.map(d => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs w-14 text-on-surface-variant font-mono">{d.label}</span>
                <div className="flex-1 h-7 bg-surface-container rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${(d.count / maxCount) * 100}%`, backgroundColor: d.color, minWidth: d.count > 0 ? '24px' : '0' }}
                  >
                    {d.count > 0 && <span className="text-[10px] font-bold text-surface">{d.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="card glass-card-elevated col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Pipeline Funnel</h3>
          <div className="space-y-2">
            {Object.entries(statuses).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[status] || '#8b8fa3' }}></div>
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / candidates.length) * 100}%`, backgroundColor: statusColors[status] || '#8b8fa3' }}></div>
                  </div>
                  <span className="text-sm font-bold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Candidates */}
        <div className="card glass-card-elevated col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Top Candidates</h3>
          <div className="space-y-2">
            {topCandidates.slice(0, 6).map((c, i) => (
              <Link to={`/candidates/${c.id}`} key={c.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition group">
                <span className="text-xs font-bold text-on-surface-variant w-5 text-center">#{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-[10px] font-bold">
                  {c.first_name[0]}{c.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{c.first_name} {c.last_name}</p>
                </div>
                <ScoreRing score={c.ai_score} size={28} strokeWidth={3} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Job Breakdown */}
      <div className="card glass-card-elevated relative z-10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Job-Level Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobStats.map(j => (
            <Link to={`/jobs/${j.id}`} key={j.id} className="p-4 bg-surface-container rounded-xl border border-[rgba(73,69,79,0.1)] hover:border-primary/30 transition group">
              <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{j.title}</h4>
              <p className="text-xs text-on-surface-variant mb-3">{j.department} • {j.location}</p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-lg font-bold">{j.total}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase">Candidates</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{j.scored}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase">Scored</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{j.avg}</div>
                  <div className="text-[10px] text-on-surface-variant uppercase">Avg Score</div>
                </div>
                <ChevronRight size={16} className="text-on-surface-variant group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
