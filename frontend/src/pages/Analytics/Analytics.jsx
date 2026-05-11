import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, Briefcase, ChevronRight, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';
import Skeleton from '../../components/shared/Skeleton';

const Analytics = () => {
  const [jobs, setJobs] = useState([]);
  const [allCandidates, setAllCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 7d, 30d, 90d, all

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, candsRes] = await Promise.all([
          api.get('jobs/'),
          api.get('candidates/')
        ]);
        setJobs(jobsRes.data.results || jobsRes.data);
        setAllCandidates(candsRes.data.results || candsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <Skeleton.PageSkeleton />;

  // Date range filter
  const now = new Date();
  const candidates = allCandidates.filter(c => {
    if (dateRange === 'all') return true;
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return new Date(c.created_at) >= cutoff;
  });

  const scored = candidates.filter(c => c.ats_score !== null && c.ats_score !== undefined);
  const avg = scored.length ? Math.round(scored.reduce((s, c) => s + c.ats_score, 0) / scored.length) : 0;
  const topCandidates = [...scored].sort((a, b) => b.ats_score - a.ats_score).slice(0, 10);
  const highQuality = scored.filter(c => c.ats_score >= 70).length;

  // Score distribution
  const ranges = [
    { label: '0-29', min: 0, max: 29, color: '#ef4444' },
    { label: '30-49', min: 30, max: 49, color: '#fb923c' },
    { label: '50-69', min: 50, max: 69, color: '#facc15' },
    { label: '70-89', min: 70, max: 89, color: '#a3e635' },
    { label: '90-100', min: 90, max: 100, color: '#22c55e' },
  ];
  const distribution = ranges.map(r => ({
    range: r.label,
    count: scored.filter(c => c.ats_score >= r.min && c.ats_score <= r.max).length,
    color: r.color
  }));

  // Status pipeline
  const statusLabels = { new: 'Applied', review: 'Review', shortlisted: 'Shortlisted', interview: 'Interview', offer: 'Offered', hired: 'Hired', rejected: 'Rejected' };
  const statusColors = { new: '#94a3b8', review: '#facc15', shortlisted: '#22c55e', interview: '#6366f1', offer: '#06b6d4', hired: '#10b981', rejected: '#ef4444' };
  const statusData = Object.entries(statusLabels).map(([key, label]) => ({
    name: label, count: candidates.filter(c => c.status === key).length, color: statusColors[key]
  })).filter(d => d.count > 0);

  // Per-job stats
  const jobStats = jobs.map(job => {
    const jobCands = candidates.filter(c => c.job === job.id);
    const jobScored = jobCands.filter(c => c.ats_score != null);
    const jobAvg = jobScored.length ? Math.round(jobScored.reduce((s, c) => s + c.ats_score, 0) / jobScored.length) : 0;
    return { ...job, total: jobCands.length, scored: jobScored.length, avg: jobAvg };
  });

  // Daily trend (last 14 days)
  const trendData = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    trendData.push({
      day: dayStr,
      applications: candidates.filter(c => new Date(c.created_at).toDateString() === date.toDateString()).length
    });
  }

  const chartTooltipStyle = {
    backgroundColor: '#1e1e2d',
    border: '1px solid rgba(189,194,255,0.15)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#e0e0e0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
  };

  return (
    <div className="space-y-6 animate-fade-in relative overflow-y-auto">
      <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[180px] opacity-5 pointer-events-none"></div>

      <header className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
          <BarChart3 size={28} className="text-primary" /> Analytics
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Talent pipeline insights across all jobs.
        </p>
        <div className="flex items-center gap-2 mt-3">
          {[{id:'7d',label:'7 Days'},{id:'30d',label:'30 Days'},{id:'90d',label:'90 Days'},{id:'all',label:'All Time'}].map(r => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateRange === r.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
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
          <Target size={24} className="text-primary mx-auto mb-2" />
          <div className="text-3xl font-bold">{highQuality}</div>
          <div className="text-xs text-on-surface-variant uppercase tracking-wider mt-1">High Quality (70+)</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Score Distribution */}
        <div className="card glass-card-elevated col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Score Distribution</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(189, 194, 255, 0.05)' }} />
                <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]} barSize={30}>
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Donut */}
        <div className="card glass-card-elevated col-span-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Pipeline Funnel</h3>
          <div className="flex items-center gap-4">
            <div className="h-[220px] w-[180px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="count" stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-on-surface">{candidates.length}</span>
                <span className="text-[9px] text-on-surface-variant uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }}></div>
                    <span className="text-on-surface-variant truncate">{s.name}</span>
                  </div>
                  <span className="font-bold ml-2">{s.count}</span>
                </div>
              ))}
            </div>
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
                <ScoreRing score={c.ats_score} size={28} strokeWidth={3} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2: Trend + Job Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Application Trend */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <Zap size={14} className="text-primary" /> Application Trend (14 Days)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorAppsAnalytics" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(189,194,255,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#colorAppsAnalytics)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Job Breakdown */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4">Job-Level Breakdown</h3>
          <div className="space-y-3">
            {jobStats.map(j => (
              <Link to={`/jobs/${j.id}`} key={j.id} className="flex items-center gap-4 p-3 bg-surface-container rounded-xl border border-[rgba(73,69,79,0.1)] hover:border-primary/30 transition group">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{j.title}</h4>
                  <p className="text-[10px] text-on-surface-variant">{j.department} • {j.location}</p>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div>
                    <div className="text-sm font-bold">{j.total}</div>
                    <div className="text-[9px] text-on-surface-variant uppercase">Total</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">{j.avg}</div>
                    <div className="text-[9px] text-on-surface-variant uppercase">Avg</div>
                  </div>
                  <ChevronRight size={16} className="text-on-surface-variant group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
