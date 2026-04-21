import React, { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import JobCreateModal from './JobCreateModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('jobs/');
      setJobs(response.data);
    } catch (error) {
      console.error("Error fetching jobs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = (newJob) => {
    setJobs([newJob, ...jobs]);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Jobs Hub</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Manage your open roles and hiring pipelines.</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Create New Job
        </button>
      </header>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search jobs..." 
            className="input-field pl-10 h-11"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
            <Building2 size={32} />
          </div>
          <h3 className="text-xl font-semibold">No active jobs</h3>
          <p className="text-on-surface-variant text-sm">Create a job to start receiving candidates.</p>
          <button className="btn-secondary mt-2" onClick={() => setIsModalOpen(true)}>Create Job</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="card glass-card hover:border-primary/50 group block">
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
              
              <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">
                {job.description}
              </p>

              <div className="flex items-center justify-between border-t border-[rgba(73,69,79,0.15)] pt-4">
                <div className="text-xs text-on-surface-variant">
                  <span className="font-semibold text-on-surface">{job.candidates_count ?? job.candidates?.length ?? 0}</span> Candidates
                </div>
                <div className="text-xs text-primary font-medium group-hover:underline">View Pipeline &rarr;</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isModalOpen && (
        <JobCreateModal onClose={() => setIsModalOpen(false)} onCreated={handleJobCreated} />
      )}
    </div>
  );
};

export default Jobs;
