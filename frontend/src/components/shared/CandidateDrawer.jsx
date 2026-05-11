import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Mail, Phone, FileDown, CheckCircle, AlertTriangle, Sparkles, Briefcase, MessageSquare, Send, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import ScoreRing from '../shared/ScoreRing';
import StatusBadge from '../shared/StatusBadge';
import { useToast } from '../../store/ToastContext';

const STAGES = [
  { id: 'new', label: 'Applied' },
  { id: 'review', label: 'Review' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offered' },
];

/**
 * CandidateDrawer — Slide-out panel for reviewing candidates without leaving the Pipeline.
 * @param {object} candidate - Candidate data
 * @param {function} onClose - Close callback
 * @param {function} onPrev - Navigate to previous candidate
 * @param {function} onNext - Navigate to next candidate
 * @param {boolean} hasPrev - Whether there is a previous candidate
 * @param {boolean} hasNext - Whether there is a next candidate
 * @param {function} onStatusChange - Status change callback (candidateId, newStatus)
 */
const CandidateDrawer = ({ candidate, onClose, onPrev, onNext, hasPrev, hasNext, onStatusChange }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [evaluation, setEvaluation] = useState(null);
  const [notes, setNotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [loadingEval, setLoadingEval] = useState(true);

  const TABS = ['Overview', 'Resume', 'Skills', 'Notes'];

  useEffect(() => {
    if (candidate) {
      setActiveTab('overview');
      setLoadingEval(true);
      // Fetch evaluation, notes, activities
      Promise.all([
        api.get('analysis/').catch(() => ({ data: [] })),
        api.get(`candidates/${candidate.id}/notes/`).catch(() => ({ data: [] })),
        api.get(`candidates/${candidate.id}/activities/`).catch(() => ({ data: [] })),
      ]).then(([evalRes, notesRes, activitiesRes]) => {
        const aiEval = (evalRes.data || []).find(e => e.candidate === candidate.id);
        setEvaluation(aiEval || null);
        setNotes(notesRes.data || []);
        setActivities(activitiesRes.data || []);
      }).finally(() => setLoadingEval(false));
    }
  }, [candidate?.id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`candidates/${candidate.id}/status/`, { status: newStatus });
      toast.success(`Status changed to ${STAGES.find(s => s.id === newStatus)?.label || newStatus}`);
      if (onStatusChange) onStatusChange(candidate.id, newStatus);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    try {
      const res = await api.post(`candidates/${candidate.id}/notes/`, { content: noteContent.trim() });
      setNotes(prev => [res.data, ...prev]);
      setNoteContent('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!candidate) return null;

  const ev = evaluation;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-surface/60 backdrop-blur-sm"></div>

      {/* Drawer Panel */}
      <div
        className="relative w-full max-w-[580px] h-full bg-surface-container-low border-l border-[rgba(73,69,79,0.15)] flex flex-col shadow-2xl animate-drawer-slide-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(73,69,79,0.15)] bg-surface-container flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center font-bold text-sm">
              {candidate.first_name[0]}{candidate.last_name[0]}
            </div>
            <div>
              <h2 className="font-bold text-on-surface text-sm">{candidate.first_name} {candidate.last_name}</h2>
              <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
                <Mail size={10} /> {candidate.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Navigation Arrows */}
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-primary/20 hover:text-primary disabled:opacity-30 transition-colors"
              title="Previous candidate (←)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-primary/20 hover:text-primary disabled:opacity-30 transition-colors"
              title="Next candidate (→)"
            >
              <ChevronRight size={16} />
            </button>
            <div className="w-px h-5 bg-[rgba(73,69,79,0.2)] mx-1"></div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center hover:bg-status-error/20 hover:text-status-error transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-3 p-3 border-b border-[rgba(73,69,79,0.15)] bg-surface-container-low flex-shrink-0">
          <StatusBadge status={candidate.status} />
          <select
            value={candidate.status}
            onChange={e => handleStatusChange(e.target.value)}
            className="input-field py-1 text-xs h-7 bg-surface-container w-32"
          >
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            <option value="rejected">Rejected</option>
          </select>

          {candidate.ats_score != null && (
            <div className="ml-auto flex items-center gap-2">
              <ScoreRing score={candidate.ats_score} size={32} strokeWidth={3} />
              <span className="text-xs font-semibold text-on-surface">{candidate.ats_score}/100</span>
            </div>
          )}

          <Link
            to={`/candidates/${candidate.id}`}
            className="text-[10px] text-primary hover:underline font-semibold ml-2 whitespace-nowrap"
          >
            Full Page →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-4 border-b border-[rgba(73,69,79,0.15)] flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`py-2.5 text-xs font-semibold transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
              {tab === 'Notes' && notes.length > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-primary/20 text-primary text-[9px] rounded-full">{notes.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loadingEval ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-4 animate-fade-in">
              {ev ? (
                <>
                  {/* Score + Confidence */}
                  <div className="card bg-surface-container p-4 flex items-center gap-4">
                    <ScoreRing score={ev.overall_score} size={80} strokeWidth={8} />
                    <div className="flex-1">
                      <h3 className="text-sm font-bold mb-1">Match Score</h3>
                      {ev.confidence && <StatusBadge status={ev.confidence} size="xs" />}
                      {ev.needs_review && (
                        <div className="mt-2 text-[10px] text-status-warning flex items-center gap-1">
                          <AlertTriangle size={12} /> {ev.review_reason || 'Needs manual review'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="card bg-surface-container p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-primary" /> Summary
                    </h4>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{ev.explanation}</p>
                  </div>

                  {/* Strengths */}
                  {ev.strengths?.length > 0 && (
                    <div className="card bg-surface-container p-4 border-l-2 border-l-status-success">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-status-success mb-2 flex items-center gap-1.5">
                        <CheckCircle size={14} /> Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {ev.strengths.slice(0, 4).map((s, i) => (
                          <li key={i} className="text-xs text-on-surface-variant flex gap-2">
                            <span className="text-status-success/50 mt-0.5">•</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Weaknesses */}
                  {ev.weaknesses?.length > 0 && (
                    <div className="card bg-surface-container p-4 border-l-2 border-l-status-warning">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-status-warning mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Gaps
                      </h4>
                      <ul className="space-y-1.5">
                        {ev.weaknesses.slice(0, 4).map((w, i) => (
                          <li key={i} className="text-xs text-on-surface-variant flex gap-2">
                            <span className="text-status-warning/50 mt-0.5">•</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles size={32} className="text-primary/40 mb-3" />
                  <p className="text-sm text-on-surface-variant">No AI analysis yet.</p>
                  <Link to={`/jobs/${candidate.job}`} className="text-xs text-primary hover:underline mt-2">Run analysis from job →</Link>
                </div>
              )}

              {/* Recent Activity */}
              {activities.length > 0 && (
                <div className="card bg-surface-container p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" /> Activity
                  </h4>
                  <div className="space-y-2">
                    {activities.slice(0, 5).map((act, i) => (
                      <div key={act.id || i} className="flex items-center gap-2 text-[11px]">
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          act.activity_type === 'status_change' ? 'bg-primary' : 'bg-tertiary'
                        }`}></div>
                        <span className="text-on-surface-variant flex-1">{act.description}</span>
                        <span className="text-on-surface-variant/50">{new Date(act.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : activeTab === 'resume' ? (
            <div className="animate-fade-in">
              {candidate.resume?.file ? (
                <div className="h-[500px] bg-surface-container rounded-xl overflow-hidden border border-[rgba(73,69,79,0.15)]">
                  <iframe
                    src={candidate.resume.file.startsWith('http') ? candidate.resume.file : `http://localhost:8000${candidate.resume.file}`}
                    className="w-full h-full"
                    title="Resume"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                  <FileDown size={32} className="mb-3 opacity-40" />
                  <p className="text-sm">No resume uploaded</p>
                </div>
              )}
            </div>

          ) : activeTab === 'skills' ? (
            <div className="space-y-4 animate-fade-in">
              <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Extracted Skills</h4>
              <div className="flex flex-wrap gap-2">
                {ev?.parsed_data?.skills?.length ? ev.parsed_data.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-surface-container-highest rounded-lg text-xs text-on-surface">{skill}</span>
                )) : <span className="text-sm text-on-surface-variant">No skills data available.</span>}
              </div>

              {ev?.parsed_data?.experience?.length > 0 && (
                <>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-6">Experience</h4>
                  <div className="space-y-3">
                    {ev.parsed_data.experience.map((exp, i) => (
                      <div key={i} className="card bg-surface-container p-3 border-l-2 border-l-primary">
                        <h5 className="font-semibold text-xs text-on-surface">{exp.title}</h5>
                        <p className="text-[10px] text-primary">{exp.company}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          ) : activeTab === 'notes' ? (
            <div className="space-y-4 animate-fade-in">
              {/* Add Note */}
              <div className="flex gap-2">
                <textarea
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Add a note..."
                  className="input-field flex-1 resize-none h-16 text-sm"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote(); }}
                />
                <button
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || addingNote}
                  className="btn-primary self-end h-8 px-3 flex items-center gap-1.5 text-xs"
                >
                  <Send size={12} /> {addingNote ? '...' : 'Add'}
                </button>
              </div>

              {/* Notes List */}
              {notes.length > 0 ? (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id} className="card bg-surface-container p-3 border-l-2 border-l-tertiary">
                      <p className="text-xs text-on-surface leading-relaxed mb-1.5">{note.content}</p>
                      <div className="flex justify-between text-[10px] text-on-surface-variant">
                        <span className="font-semibold">{note.author_name}</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant text-center py-4">No notes yet.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CandidateDrawer;
