import React from 'react';
import ScoreRing from '@/components/ui/ScoreRing';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Bookmark, BookmarkCheck, Eye, ExternalLink, Handshake, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const getOptionStr = (val) => typeof val === 'string' ? val : (val?.label || val?.value || val?.id || String(val || ''));

export default function ProjectCard({ 
  project, 
  score, 
  matchPercentage, 
  onView, 
  onSave, 
  isSaved,
  guidanceStatus,
  onGuide 
}) {
  if (!project) return null;

  const { id, title, domain, technologies = [], lifecycleStage, description, assignedMentor } = project;
  const domainText = getOptionStr(domain) || 'Software';
  const stageText = getOptionStr(lifecycleStage || project.stage || project.lifecycle_stage) || 'Submitted';

  const effectiveMatch = matchPercentage !== undefined ? matchPercentage : (project.matchPercentage || project.matchScore);
  const effectiveScore = score !== undefined ? score : (project.score || project.overallScore);
  
  const matchColor = effectiveMatch >= 80 ? 'text-green-400' :
                     effectiveMatch >= 65 ? 'text-blue-400' :
                     'text-amber-400';

  const projectUrl = `/mentor/project/${id}`;

  const renderGuidanceAction = () => {
    const status = (guidanceStatus || '').toLowerCase();
    if (status === 'accepted' || status === 'active' || (assignedMentor && assignedMentor.id)) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          Mentoring This Project
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-900/50 text-amber-300 border border-amber-500/40">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          Request Pending
        </span>
      );
    }
    if (status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-red-900/40 text-red-400 border border-red-500/30">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          Request Declined
        </span>
      );
    }
    if (onGuide) {
      return (
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={(e) => { e.stopPropagation(); onGuide(project); }}
          className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-xs flex items-center gap-1"
        >
          <Handshake className="w-3.5 h-3.5" />
          Request to Guide
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 hover:border-white/20 transition-all group flex flex-col h-full relative">
      <div className="flex justify-between items-start mb-4 gap-2">
        <div className="flex-1 pr-2 min-w-0">
          <Link to={projectUrl} className="hover:underline block min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-white mb-1 truncate group-hover:text-purple-300 transition-colors" title={title}>{title}</h3>
          </Link>
          <p className="text-sm text-gray-400 truncate" title={domainText}>{domainText}</p>
        </div>
        {effectiveScore !== undefined && (
          <div className="flex-shrink-0 ml-2">
            <ScoreRing score={effectiveScore} size="sm" />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-300 mb-4 line-clamp-2 flex-1 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="purple" className="max-w-full truncate">{stageText}</Badge>
        {Array.isArray(technologies) && technologies.slice(0, 4).map((tech, i) => {
          const techLabel = getOptionStr(tech);
          return <Badge key={i} variant="default" className="max-w-[150px] truncate">{techLabel}</Badge>;
        })}
        {Array.isArray(technologies) && technologies.length > 4 && (
          <Badge variant="default">+{technologies.length - 4}</Badge>
        )}
      </div>

      {assignedMentor && (
        <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <span><strong>Mentor:</strong> {assignedMentor.name}</span>
          {assignedMentor.domain && <span className="text-emerald-400/80">{assignedMentor.domain}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto gap-2 flex-wrap sm:flex-nowrap">
        {effectiveMatch !== undefined ? (
          <div className="flex items-center space-x-1 shrink-0">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Match</span>
            <span className={`text-sm font-bold ${matchColor}`}>{effectiveMatch}%</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center space-x-2 ml-auto shrink-0 flex-wrap">
          {renderGuidanceAction()}
          {onSave && (
            <Button variant="ghost" size="sm" onClick={onSave} icon={isSaved ? <BookmarkCheck className="w-4 h-4 text-green-500" /> : <Bookmark className="w-4 h-4" />}>
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onView} icon={<Eye className="w-4 h-4" />}>
            View
          </Button>
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new window / tab"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center justify-center shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
