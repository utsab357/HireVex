import React, { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Search, LayoutGrid, List as ListIcon, Filter, Eye, MoreVertical, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import JobCreateModal from './JobCreateModal';
import Skeleton from '../../components/shared/Skeleton';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [cands, setCands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // View State
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  
  // Filters State
  const [filters, setFilters] = useState({ department: '', location: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [jobsRes, candsRes] = await Promise.all([
        api.get('jobs/'),
        api.get('candidates/')
      ]);
      setJobs(jobsRes.data.results || jobsRes.data);
      setCands(candsRes.data.results || candsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (newJob) => {
    setJobs([newJob, ...jobs]);
    setIsModalOpen(false);
  };

  // Compute derived data for each job
  const enrichedJobs = jobs.map(job => {
    const jobCands = cands.filter(c => c.job === job.id);
    const scoredCands = jobCands.filter(c => c.ats_score !== null);
    const avgScore = scoredCands.length > 0 
      ? scoredCands.reduce((sum, c) => sum + c.ats_score, 0) / scoredCands.length 
      : null;
    return {
      ...job,
      candidates_count: jobCands.length,
      avg_score: avgScore
    };
  });

  // Filter jobs
  const filteredJobs = enrichedJobs.filter(job => {
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filters.department && job.department !== filters.department) return false;
    if (filters.location && job.location !== filters.location) return false;
    if (filters.status && job.status !== filters.status) return false;
    return true;
  });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedFilteredJobs = [...filteredJobs].sort((a, b) => {
    if (a[sortConfig.key] == null) return 1;
    if (b[sortConfig.key] == null) return -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Extract unique filter options
  const departments = [...new Set(jobs.map(j => j.department).filter(Boolean))];
  const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))];
  const statuses = ['active', 'paused', 'closed'];

  // Bottom Summary Cards Data
  const talentPool = {
    total: cands.length,
    active: cands.filter(c => c.status === 'new').length,
    inReview: cands.filter(c => c.status === 'review').length,
    shortlisted: cands.filter(c => c.status === 'shortlisted').length,
    rejected: cands.filter(c => c.status === 'rejected').length
  };
  const duplicateCVs = cands.filter(c => c.pool === 'duplicate');
  const needingAttention = {
    total: cands.filter(c => c.status === 'review' || (c.ats_score !== null && c.ats_score < 50)).length,
    inReview: cands.filter(c => c.status === 'review').length,
    lowScore: cands.filter(c => c.ats_score !== null && c.ats_score < 50).length
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Jobs</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage all your open positions and hiring pipelines.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create New Job
        </button>
      </header>

      {/* Toolbar & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative max-w-xs flex-1 lg:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search jobs..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 h-10 py-2 text-sm w-full"
            />
          </div>
          
          {/* Filter Dropdowns */}
          <select className="input-field h-10 py-2 text-sm w-32" value={filters.department} onChange={e => setFilters({...filters, department: e.target.value})}>
            <option value="">All Depts</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="input-field h-10 py-2 text-sm w-32" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
            <option value="">All Locs</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select className="input-field h-10 py-2 text-sm w-32" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-2" onClick={() => { setFilters({department:'', location:'', status:''}); setSearchQuery(''); }}>
            <RefreshCcw size={16} />
          </button>
        </div>
        
        {/* View Toggle & Total */}
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <span className="text-sm font-semibold text-on-surface-variant">Total Jobs: {filteredJobs.length}</span>
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-[rgba(73,69,79,0.15)]">
            <button className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant'}`} onClick={() => setViewMode('table')}>
              <ListIcon size={18} />
            </button>
            <button className={`p-1.5 rounded ${viewMode === 'card' ? 'bg-surface-container-highest text-primary' : 'text-on-surface-variant'}`} onClick={() => setViewMode('card')}>
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton.TableSkeleton rows={4} cols={8} />
          <div className="grid grid-cols-3 gap-6">
            <Skeleton.StatCard />
            <Skeleton.StatCard />
            <Skeleton.StatCard />
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl gap-4 py-12">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-semibold">No active jobs found</h3>
          <p className="text-on-surface-variant text-sm">Try adjusting your filters or create a new job.</p>
        </div>
      ) : (
        <div className="flex flex-col min-h-0">
          {viewMode === 'table' ? (
            /* Table View */
            <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-surface-container">
                    <tr className="border-b border-[rgba(73,69,79,0.15)] text-[12px] font-semibold text-on-surface-variant">
                      <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('title')}>Job Title</th>
                      <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('department')}>Department</th>
                      <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('location')}>Location</th>
                      <th className="p-4 text-center cursor-pointer hover:text-on-surface" onClick={() => handleSort('candidates_count')}>Candidates</th>
                      <th className="p-4 text-center cursor-pointer hover:text-on-surface" onClick={() => handleSort('avg_score')}>Avg Score</th>
                      <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('created_at')}>Created On</th>
                      <th className="p-4 cursor-pointer hover:text-on-surface" onClick={() => handleSort('status')}>Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFilteredJobs.map(job => (
                      <tr key={job.id} className="border-b border-[rgba(73,69,79,0.1)] last:border-0 hover:bg-surface-container-high transition-colors">
                        <td className="p-4 text-sm font-semibold text-on-surface">
                          <Link to={`/jobs/${job.id}`} className="hover:text-primary transition-colors">{job.title}</Link>
                        </td>
                        <td className="p-4 text-sm text-on-surface-variant">{job.department}</td>
                        <td className="p-4 text-sm text-on-surface-variant">{job.location}</td>
                        <td className="p-4 text-sm text-on-surface-variant text-center">{job.candidates_count}</td>
                        <td className="p-4 text-sm text-on-surface-variant text-center">
                          {job.avg_score ? <span className="text-primary font-semibold">{job.avg_score.toFixed(1)}</span> : '-'}
                        </td>
                        <td className="p-4 text-sm text-on-surface-variant">{new Date(job.created_at).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${job.status === 'active' ? 'bg-status-success/10 text-status-success' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-on-surface-variant">
                            <Link to={`/jobs/${job.id}`} className="hover:text-primary p-1"><Eye size={16} /></Link>
                            <button className="hover:text-primary p-1"><MoreVertical size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-[rgba(73,69,79,0.15)] flex justify-between items-center text-sm text-on-surface-variant bg-surface-container-low">
                <span>Showing 1 to {filteredJobs.length} of {filteredJobs.length} jobs</span>
                <div className="flex gap-1">
                  <button className="px-3 py-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer" disabled>&lt;</button>
                  <button className="px-3 py-1 rounded bg-primary/20 text-primary font-bold">1</button>
                  <button className="px-3 py-1 rounded bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer" disabled>&gt;</button>
                </div>
              </div>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-2 pb-4">
              {sortedFilteredJobs.map(job => (
                <Link key={job.id} to={`/jobs/${job.id}`} className="card glass-card hover:border-primary/50 group block flex flex-col h-[200px]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-2">
                        <Building2 size={14} />
                        <span>{job.department}</span>
                        <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
                        <MapPin size={14} />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${job.status === 'active' ? 'bg-status-success/10 text-status-success' : 'bg-surface-container-high text-on-surface-variant'}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-auto">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-[rgba(73,69,79,0.15)] pt-4 mt-4">
                    <div className="flex gap-4">
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                         <span className="font-semibold text-on-surface">{job.candidates_count}</span> Cands
                      </div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1">
                         <span className="font-semibold text-primary">{job.avg_score ? job.avg_score.toFixed(1) : '-'}</span> Avg Score
                      </div>
                    </div>
                    <div className="text-xs text-primary font-medium group-hover:underline">View Pipeline &rarr;</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Summary Cards (Mockup #2) */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-shrink-0">
          
          <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">Talent Pool Overview</h3>
            <div className="flex items-center gap-6">
               <div>
                 <div className="text-3xl font-bold">{talentPool.total}</div>
                 <div className="text-xs text-on-surface-variant mt-1">Total candidates in talent pool</div>
               </div>
               <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary"></div> Applied</span>
                    <span className="text-on-surface-variant">{talentPool.active}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-status-warning"></div> In Review</span>
                    <span className="text-on-surface-variant">{talentPool.inReview}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-status-success"></div> Shortlisted</span>
                    <span className="text-on-surface-variant">{talentPool.shortlisted}</span>
                  </div>
               </div>
            </div>
            <Link to="/pipeline" className="btn-secondary w-full text-center text-xs py-2.5 mt-6">View Talent Pool</Link>
          </div>

          <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 text-status-warning">Duplicate CVs</h3>
            <div className="flex-1">
              <div className="text-2xl font-bold">{duplicateCVs.length}</div>
              <div className="text-xs text-on-surface-variant mt-1 mb-4">Duplicate CVs found</div>
              <div className="space-y-2">
                {duplicateCVs.slice(0, 3).map(c => (
                  <div key={c.id} className="flex justify-between items-center text-xs py-1.5 border-b border-[rgba(73,69,79,0.1)] last:border-0">
                    <span className="font-semibold">{c.first_name} {c.last_name}</span>
                    <Link to={`/jobs/${c.job}`} className="text-primary hover:underline">Review</Link>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/pipeline" className="btn-secondary w-full text-center text-xs py-2.5 mt-4">View All Duplicates</Link>
          </div>

          <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">Jobs Needing Attention</h3>
            <div className="flex-1">
              <div className="text-2xl font-bold">{needingAttention.total}</div>
              <div className="text-xs text-on-surface-variant mt-1 mb-4">Candidates need your attention</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-[rgba(73,69,79,0.1)]">
                  <span>Candidates in Review</span>
                  <span className="font-semibold text-status-warning">{needingAttention.inReview}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-[rgba(73,69,79,0.1)]">
                  <span>Low confidence resumes</span>
                  <span className="font-semibold text-status-error">{needingAttention.lowScore}</span>
                </div>
              </div>
            </div>
            <Link to="/pipeline" className="btn-secondary w-full text-center text-xs py-2.5 mt-4">Review Action Items</Link>
          </div>

        </div>
      )}

      {isModalOpen && (
        <JobCreateModal onClose={() => setIsModalOpen(false)} onCreated={handleJobCreated} />
      )}
    </div>
  );
};

export default Jobs;
