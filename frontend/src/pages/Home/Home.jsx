import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Briefcase, UserPlus, Sparkles, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import Skeleton from '../../components/shared/Skeleton';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    jobs: 0, 
    candidates: 0, 
    pendingReview: 0,
    recentActivity: [],
    jobStats: [],
    queue: { total: 0, needsReview: 0, lowScore: 0, unscored: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [jobsRes, candsRes] = await Promise.all([
          api.get('jobs/'),
          api.get('candidates/')
        ]);
        
        const jobs = jobsRes.data.results || jobsRes.data;
        const cands = candsRes.data.results || candsRes.data;
        
        // Compute Recent Activity
        const recentActivity = cands
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(c => {
            const job = jobs.find(j => j.id === c.job) || { title: 'Unknown Job' };
            // Simple logic: if updated recently vs created recently
            const isNew = c.created_at === c.updated_at;
            let type = 'new';
            let desc = `${c.first_name} applied for ${job.title}`;
            if (c.status === 'review') { type = 'review'; desc = `${c.first_name} moved to Review in ${job.title}`; }
            else if (c.status === 'shortlisted') { type = 'shortlisted'; desc = `${c.first_name} shortlisted for ${job.title}`; }
            
            // Format time
            const date = new Date(c.created_at);
            const today = new Date();
            const diffHours = Math.floor((today - date) / (1000 * 60 * 60));
            const timeStr = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours/24)}d ago`;

            return {
              title: type === 'new' ? 'New candidate added' : type === 'review' ? 'Candidate moved to Review' : 'Candidate shortlisted',
              description: desc,
              time: timeStr,
              type: type
            };
          });

        // Compute Jobs Overview
        const jobStats = jobs.map(job => {
          const jobCands = cands.filter(c => c.job === job.id);
          const scoredCands = jobCands.filter(c => c.ats_score !== null);
          const avgScore = scoredCands.length > 0 
            ? scoredCands.reduce((sum, c) => sum + c.ats_score, 0) / scoredCands.length 
            : null;
          return {
            id: job.id,
            title: job.title,
            count: jobCands.length,
            avgScore: avgScore
          };
        }).sort((a, b) => b.count - a.count).slice(0, 5);

        // Compute Queue
        const needsReview = cands.filter(c => c.status === 'review').length;
        const lowScore = cands.filter(c => c.ats_score !== null && c.ats_score < 50).length;
        const unscored = cands.filter(c => c.ats_score === null).length;

        setStats({
          jobs: jobs.length,
          candidates: cands.length,
          pendingReview: needsReview,
          recentActivity,
          jobStats,
          queue: {
            needsReview,
            lowScore,
            unscored,
            total: needsReview + lowScore + unscored
          }
        });
        
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in relative overflow-hidden pb-8">
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
        <Skeleton.PageSkeleton />
      ) : (
        <>
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Active Jobs</h3>
                 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                   <Briefcase size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface mb-2">{stats.jobs}</div>
              <div className="text-[10px] font-bold text-status-success uppercase tracking-wider">↑ 12% vs last month</div>
            </div>

            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Total Talent</h3>
                 <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
                   <UserPlus size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface mb-2">{stats.candidates}</div>
              <div className="text-[10px] font-bold text-status-success uppercase tracking-wider">↑ 24% vs last month</div>
            </div>

            <div className="card glass-card hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider">To Review</h3>
                 <div className="w-10 h-10 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center">
                   <Sparkles size={20} />
                 </div>
              </div>
              <div className="text-4xl font-bold text-on-surface mb-2">{stats.pendingReview}</div>
              <div className="text-[10px] font-bold text-status-warning uppercase tracking-wider">↓ 5% vs last month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            
            {/* 1. Hiring Activity */}
            <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-on-surface">Hiring Activity</h2>
                <Link to="/pipeline" className="text-xs text-primary font-semibold hover:underline">View All</Link>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {stats.recentActivity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">No recent activity</div>
                ) : (
                  stats.recentActivity.map((activity, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="mt-0.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'new' ? 'bg-primary/10 text-primary' :
                          activity.type === 'review' ? 'bg-status-warning/10 text-status-warning' :
                          activity.type === 'shortlisted' ? 'bg-status-success/10 text-status-success' :
                          'bg-surface-container-highest text-on-surface-variant'
                        }`}>
                          <Briefcase size={14} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-on-surface">{activity.title}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{activity.description}</p>
                        <span className="text-[10px] text-on-surface-variant/70 mt-1 block">{activity.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Jobs Overview */}
            <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-on-surface">Jobs Overview</h2>
                <Link to="/jobs" className="text-xs text-primary font-semibold hover:underline">View All Jobs</Link>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[rgba(73,69,79,0.15)] text-[11px] uppercase tracking-wider text-on-surface-variant">
                      <th className="pb-3 font-medium">Job Title</th>
                      <th className="pb-3 font-medium text-center">Candidates</th>
                      <th className="pb-3 font-medium text-center">Avg Score</th>
                      <th className="pb-3 font-medium text-right">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.jobStats.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-sm text-on-surface-variant">No active jobs</td>
                      </tr>
                    ) : (
                      stats.jobStats.map((job) => (
                        <tr key={job.id} className="border-b border-[rgba(73,69,79,0.1)] last:border-0 hover:bg-surface-container-high transition-colors group">
                          <td className="py-3 text-sm font-medium text-on-surface">{job.title}</td>
                          <td className="py-3 text-sm text-on-surface-variant text-center">{job.count}</td>
                          <td className="py-3 text-sm text-on-surface-variant text-center">{job.avgScore ? job.avgScore.toFixed(1) : '-'}</td>
                          <td className="py-3 text-right">
                            <Link to={`/jobs/${job.id}`} className="inline-block px-3 py-1 bg-surface-container-highest hover:bg-primary/20 text-primary text-[11px] font-semibold rounded transition-colors">
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Review Queue */}
            <div className="card bg-surface-container-low border border-[rgba(73,69,79,0.15)] flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg text-on-surface flex items-center gap-2">
                  Review Queue 
                  <span className="bg-status-error/10 text-status-error text-xs px-2 py-0.5 rounded-full font-bold">{stats.queue.total}</span>
                </h2>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-on-surface">Needs manual review</span>
                  <span className="text-sm font-bold text-on-surface">{stats.queue.needsReview}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-on-surface">Low matching score (&lt; 50)</span>
                  <span className="text-sm font-bold text-on-surface">{stats.queue.lowScore}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors cursor-pointer">
                  <span className="text-sm font-medium text-on-surface">Unscored candidates</span>
                  <span className="text-sm font-bold text-on-surface">{stats.queue.unscored}</span>
                </div>
              </div>
              <Link to="/pipeline" className="mt-4 w-full py-2.5 rounded-lg border border-[rgba(73,69,79,0.3)] text-sm font-semibold text-center hover:bg-surface-container-high transition-colors text-on-surface">
                Review Now
              </Link>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
