import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Search, Filter, CheckSquare, Square, Download, ChevronLeft, ChevronRight, MoreVertical, ShieldAlert, Award, Star, Mail, Target, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';
import { useToast } from '../../store/ToastContext';
import CandidateDrawer from '../../components/shared/CandidateDrawer';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';

const STAGES = [
  { id: 'new', label: 'Applied' },
  { id: 'review', label: 'Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offered' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' }
];

const Pipeline = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const jobId = searchParams.get('job');
  const toast = useToast();
  
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState([]);
  
  // Advanced Filters & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ query: '', stage: '', minScore: '', minExp: '' });
  
  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [stageCounts, setStageCounts] = useState({});

  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'ats_score', direction: 'desc' });

  // Drawer State
  const [drawerCandidateIdx, setDrawerCandidateIdx] = useState(null);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchCandidates();
      fetchStageCounts();
    } else {
      fetchAllJobs();
    }
  }, [jobId, page, filters.stage, filters.minScore, filters.minExp]);

  const fetchAllJobs = async () => {
    try {
      const res = await api.get('jobs/');
      setAllJobs(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchJobDetails = async () => {
    try {
      const res = await api.get(`jobs/${jobId}/`);
      setJob(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchStageCounts = async () => {
    // Quick fetch to get counts for the summary bar (ignoring pagination)
    try {
      const res = await api.get(`candidates/?job_id=${jobId}`);
      // If backend returns paginated results, we might need a separate endpoint for stats.
      // Assuming res.data.results has the candidates or we just count all from an unpaginated endpoint if available.
      // We will just use the current page's data for the summary if we don't have a stats endpoint.
    } catch (error) {}
  };

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      let url = `candidates/?job_id=${jobId}&page=${page}`;
      if (filters.stage) url += `&status=${filters.stage}`;
      if (filters.minScore) url += `&min_score=${filters.minScore}`;
      if (filters.minExp) url += `&min_experience=${filters.minExp}`;
      
      const res = await api.get(url);
      
      if (res.data && res.data.results) {
        setCandidates(res.data.results);
        setTotalCount(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 20));
        
        // Calculate dynamic stage counts for the current view
        const counts = {};
        res.data.results.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
        setStageCounts(counts);
      } else {
        // Fallback if pagination is disabled
        setCandidates(res.data);
        setTotalCount(res.data.length);
        const counts = {};
        res.data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
        setStageCounts(counts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!filters.query) {
      fetchCandidates();
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`candidates/search/?job_id=${jobId}&q=${encodeURIComponent(filters.query)}`);
      setCandidates(res.data.results || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(1);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  // === Bulk Actions ===
  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedIds.size === 0) return;
    try {
      await api.post('candidates/bulk-status/', {
        candidate_ids: Array.from(selectedIds),
        status: newStatus
      });
      setSelectedIds(new Set());
      fetchCandidates();
    } catch (error) {
      console.error('Bulk update failed', error);
      toast.error('Bulk update failed');
    }
  };

  const handleBulkExport = () => {
    const selected = candidates.filter(c => selectedIds.has(c.id));
    if (selected.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Score', 'Status'];
    const rows = selected.map(c => [
      `${c.first_name} ${c.last_name}`, c.email, c.phone || '', c.ats_score || '', c.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pipeline_export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (a[sortConfig.key] == null) return 1;
    if (b[sortConfig.key] == null) return -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (!jobId) {
    return (
      <div className="space-y-6 animate-fade-in relative overflow-hidden">
        <header className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Pipeline</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Select a job to manage its candidates.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {allJobs.map(j => (
            <Link to={`/pipeline?job=${j.id}`} key={j.id} className="card glass-card hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">{j.title}</h3>
                  <p className="text-xs text-on-surface-variant">{j.department} • {j.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (!job) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-100px)] flex flex-col relative z-10">
      
      {/* 4.1 Stage Summary Bar */}
      <div className="flex bg-surface-container-low border border-[rgba(73,69,79,0.15)] rounded-xl overflow-hidden shadow-sm flex-shrink-0">
        {STAGES.map((stage, idx) => (
          <div key={stage.id} className={`flex-1 p-3 text-center ${idx !== STAGES.length - 1 ? 'border-r border-[rgba(73,69,79,0.15)]' : ''}`}>
            <div className="text-lg font-bold text-on-surface">{stageCounts[stage.id] || 0}</div>
            <div className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">{stage.label}</div>
          </div>
        ))}
      </div>

      {/* 4.2 & 4.3 Advanced Filters & Search */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-surface-container-low p-3 rounded-xl border border-[rgba(73,69,79,0.15)] flex-shrink-0">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search by name or skills..." 
              value={filters.query}
              onChange={e => setFilters({...filters, query: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input-field pl-8 py-1.5 text-sm h-9 w-full bg-surface-container"
            />
          </div>
          <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-32" value={filters.stage} onChange={e => { setFilters({...filters, stage: e.target.value}); setPage(1); }}>
            <option value="">All Stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-32" value={filters.minScore} onChange={e => { setFilters({...filters, minScore: e.target.value}); setPage(1); }}>
            <option value="">Any Score</option>
            <option value="90">&gt; 90</option>
            <option value="80">&gt; 80</option>
            <option value="70">&gt; 70</option>
          </select>
          <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-32" value={filters.minExp} onChange={e => { setFilters({...filters, minExp: e.target.value}); setPage(1); }}>
            <option value="">Any Exp</option>
            <option value="2">2+ Years</option>
            <option value="5">5+ Years</option>
            <option value="10">10+ Years</option>
          </select>
        </div>
        
        {/* Bulk Actions Bar */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-xs font-semibold text-primary mr-2">{selectedIds.size} selected</span>
              <select className="input-field py-1.5 text-xs h-8 bg-surface-container w-32 border-primary/50 text-primary" onChange={e => handleBulkStatusUpdate(e.target.value)} value="">
                <option value="" disabled>Move Stage...</option>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button onClick={() => handleBulkStatusUpdate('rejected')} className="btn-secondary py-1.5 px-3 text-xs h-8 text-status-error border-status-error/30 hover:bg-status-error/10">Reject</button>
              <button onClick={handleBulkExport} className="btn-secondary py-1.5 px-3 text-xs h-8 flex items-center gap-1"><Download size={14} /> Export</button>
            </>
          ) : (
            <span className="text-xs text-on-surface-variant italic">Select candidates for bulk actions</span>
          )}
        </div>
      </div>

      {/* 4.6 Table Enhancements */}
      <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-0 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-surface-container sticky top-0 z-10">
              <tr className="border-b border-[rgba(73,69,79,0.15)] text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <button onClick={toggleSelectAll} className="text-on-surface-variant hover:text-primary">
                    {selectedIds.size > 0 && selectedIds.size === candidates.length ? <CheckSquare size={16} className="text-primary"/> : <Square size={16} />}
                  </button>
                </th>
                <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('first_name')}>Candidate</th>
                <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('status')}>Stage</th>
                <th className="p-4 text-center cursor-pointer hover:text-on-surface" onClick={() => handleSort('ats_score')}>Score</th>
                <th className="p-4 text-center cursor-pointer hover:text-on-surface" onClick={() => handleSort('confidence')}>Confidence</th>
                <th className="p-4">Experience</th>
                <th className="p-4">Top Skills</th>
                <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('created_at')}>Applied</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : sortedCandidates.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-on-surface-variant">No candidates found matching criteria.</td></tr>
              ) : (
                sortedCandidates.map(cand => (
                  <tr key={cand.id} className={`border-b border-[rgba(73,69,79,0.1)] last:border-0 hover:bg-surface-container-high transition-colors cursor-pointer ${selectedIds.has(cand.id) ? 'bg-primary/5' : ''}`} onClick={() => setDrawerCandidateIdx(sortedCandidates.indexOf(cand))}>
                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(cand.id)} className="text-on-surface-variant hover:text-primary">
                        {selectedIds.has(cand.id) ? <CheckSquare size={16} className="text-primary"/> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center font-bold text-xs">
                          {cand.first_name[0]}{cand.last_name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-on-surface hover:text-primary transition-colors block leading-tight">
                            {cand.first_name} {cand.last_name}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-0.5">
                            <Mail size={10} /> {cand.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={cand.status} />
                    </td>
                    <td className="p-4 text-center">
                      {cand.ats_score !== null ? (
                        <div className="flex justify-center scale-75 origin-center">
                          <ScoreRing score={cand.ats_score} size={40} strokeWidth={4} />
                        </div>
                      ) : (
                        <span className="text-[10px] text-on-surface-variant">Unscored</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cand.confidence === 'high' ? 'bg-status-success/15 text-status-success' :
                        cand.confidence === 'low' ? 'bg-status-error/15 text-status-error' :
                        'bg-status-warning/15 text-status-warning'
                      }`}>
                        {cand.confidence || 'Medium'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {cand.parsed_data?.experience_years ? `${cand.parsed_data.experience_years} years` : '-'}
                    </td>
                    <td className="p-4 text-xs text-on-surface-variant max-w-[200px] truncate">
                      {cand.parsed_data?.skills ? cand.parsed_data.skills.slice(0, 3).join(', ') : '-'}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {new Date(cand.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-on-surface-variant">
                        <Link to={`/candidates/${cand.id}`} className="hover:text-primary p-1"><ArrowRightLeft size={16} /></Link>
                        <button className="hover:text-primary p-1"><MoreVertical size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 4.5 Pagination Footer */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          showing={candidates.length}
          onPageChange={setPage}
        />
      </div>

      {/* 4.7 Bottom Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0 pb-6">
        
        {/* Pipeline Summary (Donut) */}
        <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Target size={16} className="text-primary" /> Pipeline Summary
          </h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[120px]">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Review', value: stageCounts.review || 0, color: '#facc15' },
                    { name: 'Shortlisted', value: stageCounts.shortlisted || 0, color: '#a3e635' },
                    { name: 'Interview', value: stageCounts.interview || 0, color: '#6366f1' },
                    { name: 'Applied', value: stageCounts.new || 0, color: '#94a3b8' }
                  ]}
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {
                    [
                      { name: 'Review', value: stageCounts.review || 0, color: '#facc15' },
                      { name: 'Shortlisted', value: stageCounts.shortlisted || 0, color: '#a3e635' },
                      { name: 'Interview', value: stageCounts.interview || 0, color: '#6366f1' },
                      { name: 'Applied', value: stageCounts.new || 0, color: '#94a3b8' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))
                  }
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#1e1e2d', border: '1px solid rgba(189,194,255,0.1)', borderRadius: '8px', fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-bold text-on-surface">{totalCount}</span>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col items-center justify-center">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 self-start w-full">
            <Award size={16} className="text-tertiary" /> Average Score
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="scale-150 mb-2">
              <ScoreRing score={
                candidates.length > 0 
                  ? Math.round(candidates.reduce((acc, c) => acc + (c.ats_score || 0), 0) / candidates.filter(c => c.ats_score).length || 1)
                  : 0
              } size={60} strokeWidth={6} />
            </div>
            <p className="text-xs text-on-surface-variant mt-4 text-center">Across currently displayed candidates</p>
          </div>
        </div>

        {/* Top Skills (Bar) */}
        <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Top Skills
          </h3>
          <div className="flex-1 min-h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'React', count: 12 },
                { name: 'Node.js', count: 8 },
                { name: 'Python', count: 6 },
                { name: 'Django', count: 5 }
              ]} layout="vertical" margin={{top: 0, right: 0, left: 10, bottom: 0}}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} width={50} />
                <RechartsTooltip cursor={{fill: 'rgba(189, 194, 255, 0.05)'}} contentStyle={{backgroundColor: '#1e1e2d', border: 'none', borderRadius: '8px', fontSize: '12px'}} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Candidate Review Drawer */}
      {drawerCandidateIdx !== null && sortedCandidates[drawerCandidateIdx] && (
        <CandidateDrawer
          candidate={sortedCandidates[drawerCandidateIdx]}
          onClose={() => setDrawerCandidateIdx(null)}
          onPrev={() => setDrawerCandidateIdx(i => Math.max(0, i - 1))}
          onNext={() => setDrawerCandidateIdx(i => Math.min(sortedCandidates.length - 1, i + 1))}
          hasPrev={drawerCandidateIdx > 0}
          hasNext={drawerCandidateIdx < sortedCandidates.length - 1}
          onStatusChange={(id, newStatus) => {
            setCandidates(prev => prev.map(c => c.id === id ? {...c, status: newStatus} : c));
          }}
        />
      )}
    </div>
  );
};

export default Pipeline;
