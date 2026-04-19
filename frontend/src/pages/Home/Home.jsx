import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Briefcase, UserPlus, Sparkles, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, pendingReview: 0 });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [jobsRes, candsRes] = await Promise.all([
          api.get('jobs/'),
          api.get('candidates/')
        ]);
        
        const jobs = jobsRes.data;
        const cands = candsRes.data;
        
        setStats({
          jobs: jobs.length,
          candidates: cands.length,
          pendingReview: cands.filter(c => c.status === 'review').length
        });
        
        setRecentJobs(jobs.slice(0, 4));
        
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="relative z-10">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          Command Center
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Welcome back, {user?.full_name || 'User'}. Here is the overview of your pipeline.
        </p>
      </header>
      
      {/* Background decoration */}
      <div className="absolute top-[-200px] right-[-200px] w-[800px] h-[800px] bg-gradient-primary rounded-full blur-[180px] opacity-10 pointer-events-none"></div>

      {loading ? (
        <div className="p-8">Loading metrics...</div>
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-3 gap-6 relative z-10">
            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Active Jobs</h3>
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Briefcase size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface">{stats.jobs}</div>
            </div>

            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Total Talent</h3>
                 <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                   <UserPlus size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface">{stats.candidates}</div>
            </div>

            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">To Review</h3>
                 <div className="w-10 h-10 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center">
                   <Sparkles size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface">{stats.pendingReview}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 relative z-10">
            {/* Main Column */}
            <div className="col-span-2 space-y-6">
               <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col min-h-[400px]">
                 <div className="p-4 border-b border-[rgba(73,69,79,0.15)] flex items-center justify-between bg-surface-container">
                   <h2 className="font-semibold text-lg flex items-center gap-2">
                     <Building2 size={18} className="text-primary"/> Recent Jobs
                   </h2>
                   <Link to="/jobs" className="text-xs text-primary font-semibold hover:underline flex items-center">View All <ChevronRight size={14}/></Link>
                 </div>
                 
                 <div className="p-4 space-y-3 flex-1">
                    {recentJobs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
                        <Briefcase size={32} className="mb-2"/>
                        <p>No active jobs</p>
                      </div>
                    ) : (
                      recentJobs.map(job => (
                        <Link to={`/jobs/${job.id}`} key={job.id} className="flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition border border-[rgba(73,69,79,0.1)] rounded-xl group">
                          <div>
                             <h4 className="font-semibold text-on-surface group-hover:text-primary transition-colors">{job.title}</h4>
                             <p className="text-xs text-on-surface-variant mt-1">{job.department} • {job.location}</p>
                          </div>
                          <span className="text-xs bg-surface-container-highest px-3 py-1 rounded font-semibold text-on-surface-variant">View Pipeline</span>
                        </Link>
                      ))
                    )}
                 </div>
               </div>
            </div>
            
            {/* Side Column */}
            <div className="col-span-1 space-y-6">
               <div className="card glass-card border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
                  <h3 className="font-bold flex items-center gap-2 mb-2 text-primary">
                    <Sparkles size={18} /> HireVex Intelligence
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Your pipelines are performing optimally. You have {stats.pendingReview} candidates waiting for manual review after AI scoring.
                  </p>
                  <Link to="/jobs" className="btn-primary w-full flex justify-center text-sm">Review Talent</Link>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
