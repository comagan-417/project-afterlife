import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPublishedProjects } from '@/services/projects';
import { getMentorRecommendationsForProjects } from '@/services/matching';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Sparkles, Compass, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RecommendedProjects() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMatches() {
      const effectiveId = currentUser?.uid || 'mentor_demo_user';
      try {
        setLoading(true);
        // Fetch all projects from shared real database
        const projects = await getPublishedProjects();
        // Compute weighted match scores against mentor profile
        const matches = await getMentorRecommendationsForProjects(effectiveId, userProfile || {}, projects);
        setRecommendations(matches);
      } catch (err) {
        console.error("Error loading project recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMatches();
  }, [currentUser, userProfile]);

  if (loading) {
    return <LoadingSpinner fullscreen size="lg" text="AI Matching Engine comparing expertise with real database projects..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-400" />
          Projects You May Be Able to Guide
        </h1>
        <p className="text-gray-400 text-sm">
          AI-driven candidate matching computed from real student projects in the shared platform database.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <Card className="text-center py-12 text-gray-400 text-sm">
          <Compass className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Matching Projects Found Yet</h3>
          <p className="max-w-md mx-auto mt-1 mb-4">
            Ensure your mentor expertise, domains, and technologies are configured in your profile to receive precision candidate recommendations.
          </p>
          <Button onClick={() => navigate('/mentor/profile')}>Update Expertise Profile</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map(({ project, matchScore, matchExplanation }) => (
            <Card key={project.id} className="border-purple-500/30 hover:border-purple-500/60 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className="bg-purple-900/60 text-purple-300 font-bold">{project.domain || 'Software'}</Badge>
                  <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-emerald-400 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{matchScore || 85}% Match</span>
                  </div>
                </div>

                <h3 className="font-bold text-white text-lg mb-1">{project.title}</h3>
                <p className="text-xs text-gray-400 mb-3">by {project.studentName || 'Student Developer'} • {project.institution || 'Engineering College'}</p>

                <p className="text-xs text-gray-300 mb-4 line-clamp-2">{project.problemStatement || project.description}</p>

                {/* AI Match Reason Box */}
                <div className="p-3 bg-navy-900 rounded-xl border border-white/10 text-xs space-y-1 mb-4">
                  <div className="font-semibold text-purple-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> AI Match Explanation
                  </div>
                  <p className="text-gray-300 text-[11px]">{matchExplanation}</p>
                </div>

                {/* Tech tags */}
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {project.technologies.map((tech, i) => (
                      <Badge key={i} className="bg-navy-900 text-gray-300 border border-white/10 text-[10px]">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <Button
                  onClick={() => navigate(`/mentor/project/${project.id}`)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-xs flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Project & Request to Guide
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
