import React, { useState, useEffect, useRef } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Users, Award, Briefcase, Clock, ChevronRight, BarChart3, Target, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from 'recharts';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const STAGE_LABELS = {
  new: 'Applied', review: 'Review', shortlisted: 'Shortlisted',
  interview: 'Interview', offer: 'Offered', hired: 'Hired', rejected: 'Rejected'
};
const STAGE_COLORS = {
  new: '#94a3b8', review: '#facc15', shortlisted: '#22c55e',
  interview: '#6366f1', offer: '#06b6d4', hired: '#10b981', rejected: '#ef4444'
};

const Reports = () => {
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, candsRes] = await Promise.all([
          api.get('jobs/'),
          api.get('candidates/')
        ]);
        setJobs(jobsRes.data.results || jobsRes.data);
        setCandidates(candsRes.data.results || candsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-on-surface-variant">Loading reports...</div>;

  // Filter candidates
  let filtered = candidates;
  if (selectedJob) filtered = filtered.filter(c => String(c.job) === String(selectedJob));

  // Date range filter
  const now = new Date();
  if (dateRange === '7d') filtered = filtered.filter(c => (now - new Date(c.created_at)) / 86400000 <= 7);
  if (dateRange === '30d') filtered = filtered.filter(c => (now - new Date(c.created_at)) / 86400000 <= 30);
  if (dateRange === '90d') filtered = filtered.filter(c => (now - new Date(c.created_at)) / 86400000 <= 90);

  const scored = filtered.filter(c => c.ats_score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((s, c) => s + c.ats_score, 0) / scored.length) : 0;
  const highQuality = scored.filter(c => c.ats_score >= 70).length;
  const shortlisted = filtered.filter(c => c.status === 'shortlisted').length;
  const rejected = filtered.filter(c => c.status === 'rejected').length;

  // Score distribution data
  const scoreRanges = [
    { range: '0-29', min: 0, max: 29 },
    { range: '30-49', min: 30, max: 49 },
    { range: '50-69', min: 50, max: 69 },
    { range: '70-89', min: 70, max: 89 },
    { range: '90-100', min: 90, max: 100 }
  ];
  const scoreDistribution = scoreRanges.map(r => ({
    range: r.range,
    count: scored.filter(c => c.ats_score >= r.min && c.ats_score <= r.max).length
  }));

  // Status funnel data
  const statusData = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    name: label,
    count: filtered.filter(c => c.status === key).length,
    color: STAGE_COLORS[key]
  })).filter(d => d.count > 0);

  // Per-job comparison data
  const jobComparison = jobs.map(j => {
    const jCands = candidates.filter(c => c.job === j.id);
    const jScored = jCands.filter(c => c.ats_score != null);
    return {
      name: j.title.length > 15 ? j.title.slice(0, 15) + '…' : j.title,
      candidates: jCands.length,
      avgScore: jScored.length ? Math.round(jScored.reduce((s, c) => s + c.ats_score, 0) / jScored.length) : 0,
      shortlisted: jCands.filter(c => c.status === 'shortlisted').length,
    };
  });

  // Daily application trend (last 14 days)
  const trendData = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStr = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const count = filtered.filter(c => {
      const d = new Date(c.created_at);
      return d.toDateString() === date.toDateString();
    }).length;
    trendData.push({ day: dayStr, applications: count });
  }

  // Export report to CSV
  const exportReport = () => {
    const headers = ['Name', 'Email', 'Job', 'Score', 'Status', 'Applied'];
    const rows = filtered.map(c => {
      const job = jobs.find(j => j.id === c.job);
      return [
        `${c.first_name} ${c.last_name}`, c.email,
        job?.title || '', c.ats_score || '', c.status,
        new Date(c.created_at).toLocaleDateString()
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hirevex_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

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

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface flex items-center gap-3">
            <FileText size={28} className="text-primary" /> Reports
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">Generate and export hiring performance reports.</p>
        </div>
        <button onClick={exportReport} className="btn-primary flex items-center gap-2 self-start md:self-auto">
          <Download size={16} /> Export CSV
        </button>
      </header>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center bg-surface-container-low p-3 rounded-xl border border-[rgba(73,69,79,0.15)] relative z-10">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
          <Filter size={14} /> Filters:
        </div>
        <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-40" value={selectedJob} onChange={e => setSelectedJob(e.target.value)}>
          <option value="">All Jobs</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-36" value={dateRange} onChange={e => setDateRange(e.target.value)}>
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
        <span className="text-xs text-on-surface-variant ml-auto">{filtered.length} candidates in scope</span>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 relative z-10">
        {[
          { label: 'Total Candidates', value: filtered.length, icon: Users, color: 'text-primary' },
          { label: 'Scored', value: scored.length, icon: Award, color: 'text-status-success' },
          { label: 'Avg Score', value: avgScore, icon: TrendingUp, color: 'text-tertiary' },
          { label: 'High Quality (70+)', value: highQuality, icon: Target, color: 'text-primary' },
          { label: 'Shortlisted', value: shortlisted, icon: ChevronRight, color: 'text-status-success' },
          { label: 'Rejected', value: rejected, icon: AlertTriangle, color: 'text-status-error' },
        ].map(kpi => (
          <div key={kpi.label} className="card glass-card text-center py-4 px-3">
            <kpi.icon size={20} className={`${kpi.color} mx-auto mb-2`} />
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Score Distribution + Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Score Distribution Bar Chart */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Score Distribution
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(189, 194, 255, 0.05)' }} />
                <Bar dataKey="count" name="Candidates" radius={[6, 6, 0, 0]} barSize={36}>
                  {scoreDistribution.map((entry, index) => {
                    const colors = ['#ef4444', '#fb923c', '#facc15', '#a3e635', '#22c55e'];
                    return <Cell key={`cell-${index}`} fill={colors[index]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Funnel Donut */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Pipeline Breakdown
          </h3>
          <div className="flex items-center gap-6">
            <div className="h-[240px] w-[240px] relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="count" stroke="none">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-on-surface">{filtered.length}</span>
                <span className="text-[10px] text-on-surface-variant uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {statusData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></div>
                    <span className="text-on-surface-variant">{s.name}</span>
                  </div>
                  <span className="font-bold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Application Trend + Job Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Application Trend */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Application Trend (14 Days)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(189,194,255,0.08)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Comparison */}
        <div className="card glass-card-elevated">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2">
            <Briefcase size={16} className="text-primary" /> Job Comparison
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobComparison} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'rgba(189, 194, 255, 0.05)' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="candidates" name="Candidates" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="avgScore" name="Avg Score" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="shortlisted" name="Shortlisted" fill="#facc15" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Candidate Table */}
      <div className="card glass-card-elevated p-0 relative z-10">
        <div className="p-4 border-b border-[rgba(73,69,79,0.15)] flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">Candidate Detail Report</h3>
          <span className="text-xs text-on-surface-variant">{filtered.length} rows</span>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-surface-container sticky top-0 z-10">
              <tr className="border-b border-[rgba(73,69,79,0.15)] text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-3">#</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Email</th>
                <th className="p-3">Job</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3">Stage</th>
                <th className="p-3">Applied</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((c, i) => {
                const job = jobs.find(j => j.id === c.job);
                return (
                  <tr key={c.id} className="border-b border-[rgba(73,69,79,0.08)] hover:bg-surface-container-high transition-colors text-sm">
                    <td className="p-3 text-on-surface-variant">{i + 1}</td>
                    <td className="p-3 font-medium">{c.first_name} {c.last_name}</td>
                    <td className="p-3 text-on-surface-variant">{c.email}</td>
                    <td className="p-3 text-on-surface-variant">{job?.title || '-'}</td>
                    <td className="p-3 text-center">
                      {c.ats_score != null ? (
                        <div className="flex justify-center scale-75 origin-center">
                          <ScoreRing score={c.ats_score} size={36} strokeWidth={4} />
                        </div>
                      ) : <span className="text-[10px] text-on-surface-variant">-</span>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'shortlisted' ? 'bg-status-success/15 text-status-success' :
                        c.status === 'rejected' ? 'bg-status-error/15 text-status-error' :
                        c.status === 'interview' ? 'bg-primary/15 text-primary' :
                        'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {STAGE_LABELS[c.status] || c.status}
                      </span>
                    </td>
                    <td className="p-3 text-on-surface-variant">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
