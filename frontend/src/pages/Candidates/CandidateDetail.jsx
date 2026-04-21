import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle, HelpCircle, Mail, X, Phone, FileDown, Briefcase } from 'lucide-react';
import api from '../../api/client';
import ScoreRing from '../../components/shared/ScoreRing';

const CandidateDetail = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Outreach Flow
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachData, setOutreachData] = useState(null);

  useEffect(() => {
    fetchCandidate();
  }, [id]);

  const fetchCandidate = async () => {
    try {
      const [candRes, evalRes] = await Promise.all([
        api.get(`candidates/${id}/`),
        api.get(`analysis/`)
      ]);
      
      const candData = candRes.data;
      const aiEval = evalRes.data.find(e => e.candidate === parseInt(id) || e.candidate === id);
      
      setCandidate({
        ...candData,
        evaluation: aiEval
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateOutreach = async (type) => {
    setOutreachLoading(true);
    try {
        const res = await api.post('outreach/generate/', {
            candidate_id: id,
            type: type
        });
        setOutreachData(res.data);
    } catch (err) {
        console.error("Failed to generate outreach", err);
    } finally {
        setOutreachLoading(false);
    }
  };

  const startOutreach = (type) => {
      setIsOutreachOpen(true);
      handleGenerateOutreach(type);
  };

  if (loading) return <div className="p-8">Loading candidate intelligence...</div>;
  if (!candidate) return <div className="p-8">Candidate not found</div>;

  const ev = candidate.evaluation;

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-primary rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

      <header className="relative z-10">
        <div className="flex items-start gap-4">
          <Link to={`/jobs/${candidate.job}`} className="mt-2 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high hover:bg-surface-container-highest transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-xl font-bold shadow-lg">
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-1">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  <div className="flex items-center gap-4 text-on-surface-variant text-sm">
                    <span className="flex items-center gap-1.5"><Mail size={14} /> {candidate.email}</span>
                    {candidate.phone && (
                      <span className="flex items-center gap-1.5"><Phone size={14} /> {candidate.phone}</span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      candidate.status === 'shortlisted' ? 'bg-status-success/15 text-status-success' :
                      candidate.status === 'rejected' ? 'bg-status-error/15 text-status-error' :
                      candidate.status === 'interview' ? 'bg-primary/15 text-primary' :
                      'bg-surface-container-highest text-on-surface-variant'
                    }`}>{candidate.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    if (candidate.resume?.file) {
                      const fileUrl = candidate.resume.file.startsWith('http') 
                        ? candidate.resume.file 
                        : `http://localhost:8000${candidate.resume.file}`;
                      window.open(fileUrl, '_blank');
                    } else {
                      alert('No resume file available for this candidate.');
                    }
                  }}
                  className="btn-secondary flex items-center gap-2"
                ><FileDown size={16} /> View Resume</button>
                <button 
                  onClick={() => startOutreach('interview')}
                  className="btn-primary flex items-center gap-2"
                >
                  <Mail size={16} /> Draft Outreach
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {!ev ? (
        <div className="flex-1 flex flex-col items-center justify-center card glass-card">
          <Sparkles size={48} className="text-primary mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">No AI Analysis Yet</h2>
          <p className="text-on-surface-variant text-sm mb-6">Run the AI engine from the Job Board to see explainable insights.</p>
          <Link to={`/jobs/${candidate.job}`} className="btn-primary">Return to Talent Pool</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 flex-1 min-h-0 relative z-10">
           {/* Left Column: Overall Score & Explanation */}
           <div className="col-span-1 space-y-6 flex flex-col">
             <div className="card glass-card-elevated flex flex-col items-center justify-center py-10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-tertiary to-secondary"></div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.1em] mb-6">Match Score</h3>
                <ScoreRing score={ev.overall_score} size={160} strokeWidth={12} />
                {ev.confidence && (
                  <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    ev.confidence === 'high' ? 'bg-status-success/20 text-status-success' :
                    ev.confidence === 'medium' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-status-error/20 text-status-error'
                  }`}>
                    {ev.confidence === 'high' ? '🟢' : ev.confidence === 'medium' ? '🟡' : '🔴'} {ev.confidence} confidence
                  </div>
                )}
                {ev.needs_review && (
                  <div className="mt-3 px-3 py-1.5 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>{ev.review_reason || 'Needs manual review'}</span>
                  </div>
                )}
                <p className="mt-4 text-sm text-on-surface-variant max-w-[200px]">
                  Based on rule-based matching with job requirements.
                </p>
             </div>

             <div className="card glass-card flex-1">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Briefcase size={18} className="text-primary" />
                  Summary
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {ev.explanation}
                </p>
             </div>
           </div>

           {/* Right Column: Strengths, Weaknesses, Questions */}
           <div className="col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">
              
              {/* Strength Box */}
              <div className="card bg-surface-container border border-status-success/20">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-status-success">
                  <CheckCircle size={18} /> Highlighted Strengths
                </h3>
                <ul className="space-y-3">
                  {ev.strengths.map((str, i) => (
                    <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                      <span className="text-status-success/50 mt-1">•</span>
                      <span className="leading-relaxed">{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weakness Box */}
              <div className="card bg-surface-container border border-status-warning/20">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-status-warning">
                  <AlertTriangle size={18} /> Potential Gaps
                </h3>
                <ul className="space-y-3">
                  {ev.weaknesses.map((weak, i) => (
                    <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                      <span className="text-status-warning/50 mt-1">•</span>
                      <span className="leading-relaxed">{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>




           </div>
        </div>
      )}

      {/* Outreach Modal */}
      {isOutreachOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-end bg-surface/80 backdrop-blur-sm animate-fade-in pr-6">
            <div className="bg-surface-container-low border border-[rgba(73,69,79,0.15)] rounded-2xl w-[500px] h-[calc(100vh-48px)] flex flex-col shadow-2xl relative">
                <div className="p-6 border-b border-[rgba(73,69,79,0.15)] flex justify-between items-center bg-surface-container rounded-t-2xl">
                    <h2 className="font-bold flex items-center gap-2"><Sparkles size={18} className="text-primary"/> AI Communication Draft</h2>
                    <button onClick={() => setIsOutreachOpen(false)} className="text-on-surface-variant hover:text-on-surface"><X size={20}/></button>
                </div>

                <div className="p-4 flex gap-2 border-b border-[rgba(73,69,79,0.15)]">
                    {['interview', 'offer', 'rejection'].map(type => (
                       <button 
                          key={type}
                          onClick={() => handleGenerateOutreach(type)}
                          className="btn-secondary text-xs py-1"
                       >
                          {type === 'interview' ? 'Interview Invite' : type === 'offer' ? 'Offer Letter' : 'Rejection'}
                       </button>
                    ))}
                </div>

                <div className="flex-1 p-6 flex flex-col">
                   {outreachLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
                         <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                         Crafting personalized email...
                      </div>
                   ) : outreachData ? (
                      <div className="flex-1 flex flex-col space-y-4">
                         <div>
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Subject</label>
                            <input type="text" className="input-field w-full" value={outreachData.subject} readOnly />
                         </div>
                         <div className="flex-1 flex flex-col">
                            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2 block">Email Body</label>
                            <textarea className="input-field w-full flex-1 resize-none font-mono text-sm leading-relaxed" value={outreachData.body} readOnly></textarea>
                         </div>
                         <a 
                           href={`mailto:${candidate.email}?subject=${encodeURIComponent(outreachData.subject)}&body=${encodeURIComponent(outreachData.body)}`}
                           className="btn-primary w-full flex justify-center mt-4"
                         >
                           Open in Email Client
                         </a>
                      </div>
                   ) : null}
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CandidateDetail;
