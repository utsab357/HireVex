import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Users, Search, Filter, LayoutGrid, List as ListIcon, Building2, Mail, MapPin, MoreVertical, ArrowRightLeft, CheckSquare, Square, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';
import { useToast } from '../../store/ToastContext';
import Skeleton from '../../components/shared/Skeleton';
import ErrorState from '../../components/shared/ErrorState';

const STAGES = [
  { id: 'new', label: 'Applied' },
  { id: 'review', label: 'Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offered' },
  { id: 'hired', label: 'Hired' },
  { id: 'rejected', label: 'Rejected' }
];

const Candidates = () => {
  const toast = useToast();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  
  // View State
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ query: '', stage: '', minScore: '', jobId: '' });
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchAllJobs();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [page, filters.stage, filters.minScore, filters.jobId]);

  const fetchAllJobs = async () => {
    try {
      const res = await api.get('jobs/');
      setAllJobs(res.data.results || res.data);
    } catch (error) { console.error(error); }
  };

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `candidates/?page=${page}`;
      if (filters.jobId) url += `&job_id=${filters.jobId}`;
      if (filters.stage) url += `&status=${filters.stage}`;
      if (filters.minScore) url += `&min_score=${filters.minScore}`;
      
      const res = await api.get(url);
      if (res.data && res.data.results) {
        setCandidates(res.data.results);
        setTotalCount(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 20));
      } else {
        setCandidates(res.data);
        setTotalCount(res.data.length);
      }
    } catch (error) {
      console.error(error);
      setError('Failed to load candidates. Please try again.');
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
      let url = `candidates/search/?q=${encodeURIComponent(filters.query)}`;
      if (filters.jobId) url += `&job_id=${filters.jobId}`;
      const res = await api.get(url);
      setCandidates(res.data.results || []);
      setTotalCount(res.data.count || 0);
      setTotalPages(1);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length && candidates.length > 0) {
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

  return (
    <div className="space-y-6 animate-fade-in relative h-[calc(100vh-100px)] flex flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Candidates Hub</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Global view of all candidates across all jobs.</p>
        </div>
      </header>

      {/* Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-surface-container-low p-3 rounded-xl border border-[rgba(73,69,79,0.15)] flex-shrink-0">
        <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
          <div className="relative flex-1 lg:w-64 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search all candidates..." 
              value={filters.query}
              onChange={e => setFilters({...filters, query: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="input-field pl-8 py-1.5 text-sm h-9 w-full bg-surface-container"
            />
          </div>
          <select className="input-field py-1.5 text-sm h-9 bg-surface-container w-36" value={filters.jobId} onChange={e => { setFilters({...filters, jobId: e.target.value}); setPage(1); }}>
            <option value="">All Jobs</option>
            {allJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
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
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex bg-surface-container rounded-lg p-1 border border-[rgba(73,69,79,0.15)]">
            <button className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant'}`} onClick={() => setViewMode('table')}>
              <ListIcon size={16} />
            </button>
            <button className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant'}`} onClick={() => setViewMode('card')}>
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && viewMode === 'table' && (
        <div className="flex items-center gap-3 bg-primary/10 p-2 rounded-lg border border-primary/20 flex-shrink-0 animate-fade-in">
          <span className="text-sm font-semibold text-primary ml-2">{selectedIds.size} candidates selected</span>
          <select className="input-field py-1.5 text-xs h-8 bg-surface-container w-32 ml-auto" onChange={e => handleBulkStatusUpdate(e.target.value)} value="">
            <option value="" disabled>Move Stage...</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button onClick={() => handleBulkStatusUpdate('rejected')} className="btn-secondary py-1.5 px-3 text-xs h-8 text-status-error border-status-error/30 hover:bg-status-error/10">Reject</button>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading ? (
          <Skeleton.TableSkeleton rows={6} cols={7} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCandidates} />
        ) : candidates.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[rgba(73,69,79,0.3)] rounded-2xl gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-semibold">No candidates found</h3>
            <p className="text-on-surface-variant text-sm">Try adjusting your filters or search query.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View */
          <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-0 overflow-hidden flex flex-col flex-1">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-surface-container sticky top-0 z-10">
                  <tr className="border-b border-[rgba(73,69,79,0.15)] text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                    <th className="p-4 w-12 text-center">
                      <button onClick={toggleSelectAll} className="text-on-surface-variant hover:text-primary">
                        {selectedIds.size > 0 && selectedIds.size === candidates.length ? <CheckSquare size={16} className="text-primary"/> : <Square size={16} />}
                      </button>
                    </th>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Job</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4">Applied On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(cand => {
                    const jobDetails = allJobs.find(j => j.id === cand.job) || {};
                    return (
                      <tr key={cand.id} className={`border-b border-[rgba(73,69,79,0.1)] last:border-0 hover:bg-surface-container-high transition-colors ${selectedIds.has(cand.id) ? 'bg-primary/5' : ''}`}>
                        <td className="p-4 text-center">
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
                              <Link to={`/candidates/${cand.id}`} className="font-semibold text-sm text-on-surface hover:text-primary transition-colors block leading-tight">
                                {cand.first_name} {cand.last_name}
                              </Link>
                              <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-0.5">
                                <Mail size={10} /> {cand.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-on-surface-variant max-w-[200px] truncate" title={jobDetails.title}>
                          <Link to={`/jobs/${jobDetails.id}`} className="hover:text-primary hover:underline">{jobDetails.title || `Job #${cand.job}`}</Link>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            cand.status === 'shortlisted' ? 'bg-status-success/15 text-status-success' :
                            cand.status === 'rejected' ? 'bg-status-error/15 text-status-error' :
                            cand.status === 'interview' ? 'bg-primary/15 text-primary' :
                            'bg-surface-container-highest text-on-surface-variant'
                          }`}>
                            {STAGES.find(s => s.id === cand.status)?.label || cand.status}
                          </span>
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
                        <td className="p-4 text-sm text-on-surface-variant">
                          {new Date(cand.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Link to={`/candidates/${cand.id}`} className="btn-secondary py-1 px-3 text-xs inline-flex items-center gap-1">
                            Review
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-3 border-t border-[rgba(73,69,79,0.15)] flex justify-between items-center text-xs text-on-surface-variant bg-surface-container">
              <span>Showing {candidates.length} of {totalCount} candidates</span>
              <div className="flex gap-2 items-center">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="p-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-semibold">Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pr-2 pb-4">
            {candidates.map(cand => {
              const jobDetails = allJobs.find(j => j.id === cand.job) || {};
              return (
                <div key={cand.id} className="card glass-card hover:border-primary/50 group block flex flex-col h-[220px]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center font-bold">
                        {cand.first_name[0]}{cand.last_name[0]}
                      </div>
                      <div>
                        <Link to={`/candidates/${cand.id}`} className="font-bold text-on-surface hover:text-primary transition-colors block text-sm leading-tight">
                          {cand.first_name} {cand.last_name}
                        </Link>
                        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant mt-0.5 max-w-[120px] truncate">
                          {jobDetails.title || `Job #${cand.job}`}
                        </div>
                      </div>
                    </div>
                    {cand.ats_score !== null && (
                      <div className="flex-shrink-0 scale-75 origin-top-right -mt-1 -mr-1">
                        <ScoreRing score={cand.ats_score} size={40} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider self-start mb-3 ${
                    cand.status === 'shortlisted' ? 'bg-status-success/15 text-status-success' :
                    cand.status === 'rejected' ? 'bg-status-error/15 text-status-error' :
                    cand.status === 'interview' ? 'bg-primary/15 text-primary' :
                    'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {STAGES.find(s => s.id === cand.status)?.label || cand.status}
                  </span>

                  <div className="text-xs text-on-surface-variant mb-auto space-y-1">
                     <div className="flex items-center gap-2"><Mail size={12} className="opacity-70"/> {cand.email}</div>
                     <div className="flex items-center gap-2"><MapPin size={12} className="opacity-70"/> {cand.location || "Location unlisted"}</div>
                     <div className="flex items-center gap-2 mt-2 font-medium">Applied: {new Date(cand.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(73,69,79,0.15)] flex justify-between items-center mt-3">
                    <Link to={`/candidates/${cand.id}`} className="text-xs text-primary font-medium hover:underline w-full text-center">
                      Full Review →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Candidates;
