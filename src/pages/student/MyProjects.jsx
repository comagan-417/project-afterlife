import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, Filter, Users } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ScoreRing from '@/components/ui/ScoreRing';
import { getStudentProjects } from '@/services/projects';
import { formatDate, truncate, getTechTagColor } from '@/utils/helpers';
import { LIFECYCLE_STAGES } from '@/utils/constants';

const getOptionVal = (opt) => typeof opt === 'object' && opt !== null ? (opt.value || opt.label || opt.id || '') : String(opt || '');
const getOptionLabel = (opt) => typeof opt === 'object' && opt !== null ? (opt.label || opt.value || opt.id || '') : String(opt || '');

export default function MyProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStage, setFilterStage] = useState('All');

  useEffect(() => {
    async function fetchProjects() {
      if (!currentUser) return;
      const studentId = currentUser.id || currentUser.uid;
      try {
        setLoading(true);
        const data = await getStudentProjects(studentId);
        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [currentUser]);

  const filteredProjects = filterStage === 'All' 
    ? projects 
    : projects.filter(p => getOptionVal(p.lifecycleStage) === filterStage || p.lifecycleStage === filterStage);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px]"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Button onClick={() => navigate('/student/upload')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-2 bg-navy-800 p-2 rounded-lg w-fit">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            className="bg-transparent text-white border-none focus:ring-0 text-sm cursor-pointer py-1 pr-8"
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
          >
            <option value="All">All Stages</option>
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const val = getOptionVal(stage);
              const label = getOptionLabel(stage);
              return <option key={val || idx} value={val}>{label}</option>;
            })}
          </select>
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState 
          icon={<FolderOpen className="w-16 h-16 text-gray-500" />}
          title="No projects found"
          description="You haven't uploaded any projects yet. Upload your first project to get an AI-powered evaluation."
          action={<Button onClick={() => navigate('/student/upload')}>Upload Project</Button>}
        />
      ) : filteredProjects.length === 0 ? (
        <EmptyState 
          icon={<Filter className="w-16 h-16 text-gray-500" />}
          title="No projects match filter"
          description={`You don't have any projects in the "${filterStage}" stage.`}
          action={<Button variant="outline" onClick={() => setFilterStage('All')}>Clear Filter</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card 
              key={project.id} 
              className="bg-navy-800 border-navy-700 hover:border-blue-500 transition-colors cursor-pointer flex flex-col h-full"
              onClick={() => navigate(`/student/evaluation?projectId=${project.id}`)}
            >
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-lg line-clamp-2">{project.title || 'Untitled Project'}</h3>
                  {(project.score > 0 || project.completionPercentage > 0) && (
                    <div className="flex-shrink-0">
                      <ScoreRing score={project.score || project.completionPercentage || 0} size="sm" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-navy-700 text-gray-300">{getOptionLabel(project.domain) || 'Software'}</Badge>
                  <Badge className="bg-blue-900/40 text-blue-400">{getOptionLabel(project.lifecycleStage) || 'Submitted'}</Badge>
                </div>
                
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {truncate(project.description || project.problemStatement || 'No description provided.', 120)}
                </p>
                
                {project.assignedMentor && (
                  <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300">
                    <div className="font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      Mentor Assigned: {project.assignedMentor.name}
                    </div>
                    {project.assignedMentor.domain && (
                      <div className="text-gray-300 text-[11px] mt-0.5">Domain: {project.assignedMentor.domain}</div>
                    )}
                  </div>
                )}

                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.technologies.slice(0, 3).map((tech, i) => (
                      <span key={i} className={`text-[10px] px-2 py-1 rounded-full ${getTechTagColor(tech)}`}>
                        {typeof tech === 'object' ? getOptionLabel(tech) : tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-navy-700 text-gray-400">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="px-5 py-3 border-t border-navy-700 bg-navy-800/50 flex justify-between items-center text-xs text-gray-400 rounded-b-lg">
                <span>Created {formatDate(project.createdAt || project.uploadTimestamp)}</span>
                <span className="text-blue-400 hover:text-blue-300 font-medium">View Evaluation →</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
