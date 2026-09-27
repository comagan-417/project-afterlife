import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Bookmark, Check, Send, Award, Github, Globe, Handshake, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner, Button, Card, Badge } from '@/components/ui';
import { ScoreCard, EvidenceCard, LifecycleTimeline } from '@/components/project';
import { SUPPORT_TYPES } from '@/utils/constants.js';
import { createConnectionRequest, toggleSaveProject, getMentorGuidanceRequests } from '@/services/connections';
import { getProjectData } from '@/services/projects';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [projectData, setProjectData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [guidanceStatus, setGuidanceStatus] = useState(null); // 'pending' | 'accepted' | 'declined' | null
  const [statusMessage, setStatusMessage] = useState(null);
  
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportType, setSupportType] = useState('Technical Guidance');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  const loadData = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Load project data
      const data = await getProjectData(projectId);
      if (data && data.project) {
        setProjectData(data);
        setSupportMessage(`Hi team, I found your project "${data.project.title || 'Project'}" interesting and would like to guide and support your development.`);
        setSupportType(userProfile?.supportTypesOffered?.[0] || 'Technical Guidance');
        
        // If assigned to current mentor
        if (data.project.assignedMentor?.id === (currentUser?.id || currentUser?.uid)) {
          setGuidanceStatus('accepted');
        }
      } else {
        setProjectData(null);
      }
      
      // Check mentor's guidance request status for this project
      try {
        const mentorships = await getMentorGuidanceRequests();
        const thisReq = mentorships.find(m => m.projectId === projectId || m.project_id === projectId);
        if (thisReq) {
          setGuidanceStatus(thisReq.status?.toLowerCase() || 'pending');
        }
      } catch (err) {
        console.warn("Mentorships check warning:", err);
      }

      // Check local saved cache
      try {
        const localSaved = JSON.parse(localStorage.getItem('pa_local_saved_projects') || '[]');
        const isLocallySaved = localSaved.some(s => s.projectId === projectId || s.id === projectId);
        setIsSaved(isLocallySaved);
      } catch(e) {}

    } catch (err) {
      console.error("Error loading project detail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('connections_updated', loadData);
    return () => window.removeEventListener('connections_updated', loadData);
  }, [projectId, currentUser, userProfile]);

  const handleToggleSave = async () => {
    try {
      const saved = await toggleSaveProject(currentUser?.uid, projectId);
      setIsSaved(saved);
    } catch (err) {
      console.error("Error saving:", err);
    }
  };

  const handleSendSupport = async () => {
    if (!supportType) return;
    try {
      setSubmittingSupport(true);
      setStatusMessage(null);
      await createConnectionRequest(
        currentUser?.id || currentUser?.uid, 
        projectData?.project?.userId || projectData?.project?.studentId, 
        projectId, 
        supportType, 
        supportMessage
      );
      setGuidanceStatus('pending');
      setSupportModalOpen(false);
      setStatusMessage({ type: 'success', text: 'Guidance request sent successfully.' });
    } catch (err) {
      console.error("Error sending support:", err);
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('already exists')) {
        setStatusMessage({ type: 'warning', text: 'Request already exists.' });
        setGuidanceStatus('pending');
      } else {
        setStatusMessage({ type: 'error', text: 'Unable to send request. Please try again.' });
      }
      setSupportModalOpen(false);
    } finally {
      setSubmittingSupport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8">
        <LoadingSpinner fullscreen size="lg" text="Loading Project Details..." />
      </div>
    );
  }

  if (!projectData || !projectData.project) {
    return (
      <div className="min-h-screen bg-navy-900 text-white p-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-2xl font-bold">Project Details Unavailable</h1>
          <p className="text-gray-400">The requested project could not be found or has not been published yet.</p>
          <Button onClick={() => navigate('/mentor/discover')} variant="primary" className="bg-purple-600 hover:bg-purple-700">
            Back to Discovery
          </Button>
        </div>
      </div>
    );
  }

  const { project, projectAnalysis, projectScore, projectEvidence } = projectData;

  const domainText = typeof project.domain === 'string' ? project.domain : (project.domain?.label || 'Software');
  const stageText = typeof project.lifecycleStage === 'string' ? project.lifecycleStage : (project.stage?.label || project.stage || project.lifecycle_stage || 'Submitted');
  const problemText = project.problemStatement || (typeof project.problem === 'string' ? project.problem : project.description || 'Problem statement documented in project submission.');
  const solutionText = project.proposedSolution || (typeof project.solution === 'string' ? project.solution : project.description || 'Solution architecture defined in project submission.');
  const techList = Array.isArray(project.technologies) ? project.technologies : [];
  const supportNeedsList = Array.isArray(project.support_required) ? project.support_required : (Array.isArray(project.supportNeeds) ? project.supportNeeds : []);

  const renderGuidanceButton = () => {
    if (guidanceStatus === 'accepted' || guidanceStatus === 'active') {
      return (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg flex items-center gap-2 text-emerald-300 font-semibold text-sm justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          Mentoring This Project
        </div>
      );
    }
    if (guidanceStatus === 'pending') {
      return (
        <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-lg flex items-center gap-2 text-amber-300 font-semibold text-sm justify-center">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          Request Pending
        </div>
      );
    }
    if (guidanceStatus === 'declined') {
      return (
        <div className="space-y-2">
          <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-red-300 font-semibold text-xs justify-center">
            <XCircle className="w-4 h-4 text-red-400" />
            Previous Request Declined
          </div>
          <Button 
            variant="primary" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white" 
            onClick={() => setSupportModalOpen(true)}
            icon={<Handshake className="w-4 h-4" />}
          >
            I Wish to Guide This Project
          </Button>
        </div>
      );
    }
    return (
      <Button 
        variant="primary" 
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5" 
        onClick={() => setSupportModalOpen(true)}
        icon={<Handshake className="w-4 h-4" />}
      >
        I Wish to Guide This Project
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <Button variant="ghost" className="text-gray-400 hover:text-white px-0" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
          Back
        </Button>

        {statusMessage && (
          <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
            statusMessage.type === 'success' ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-200' :
            statusMessage.type === 'warning' ? 'bg-amber-900/40 border border-amber-500/50 text-amber-200' :
            'bg-red-900/40 border border-red-500/50 text-red-200'
          }`}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <Badge variant="purple">{domainText}</Badge>
                <Badge variant="outline" className="border-navy-600 text-gray-300">{stageText}</Badge>
                {project.assignedMentor && (
                  <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                    Mentor Assigned: {project.assignedMentor.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 break-words leading-tight">{project.title || 'Untitled Project'}</h1>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed break-words">{project.description}</p>
            </div>

            {(project.githubUrl || project.github_url || project.demoUrl || project.demo_url) && (
              <div className="flex flex-wrap gap-4">
                {(project.githubUrl || project.github_url) && (
                  <a href={project.githubUrl || project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white bg-navy-800 px-4 py-2 rounded-md border border-navy-700 max-w-full truncate">
                    <Github className="w-5 h-5 text-purple-400 shrink-0" /> <span className="truncate">GitHub Repository</span>
                  </a>
                )}
                {(project.demoUrl || project.demo_url) && (
                  <a href={project.demoUrl || project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-300 hover:text-white bg-navy-800 px-4 py-2 rounded-md border border-navy-700 max-w-full truncate">
                    <Globe className="w-5 h-5 text-purple-400 shrink-0" /> <span className="truncate">Live Demo</span>
                  </a>
                )}
              </div>
            )}

            <Card className="bg-navy-800 border-navy-700 p-6">
              <h3 className="text-xl font-bold mb-4 border-b border-navy-700 pb-2">The Problem</h3>
              <p className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">{problemText}</p>
              
              <h3 className="text-xl font-bold mb-4 mt-6 border-b border-navy-700 pb-2">The Solution</h3>
              <p className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">{solutionText}</p>
            </Card>

            {techList.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3">Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  {techList.map((tech, i) => (
                    <Badge key={i} variant="outline" className="bg-navy-800">{tech}</Badge>
                  ))}
                </div>
              </div>
            )}

            {projectScore && (
              <div className="pt-4">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-400" /> AI Assessment & Scoring
                </h2>
                <ScoreCard scoreData={projectScore} />
              </div>
            )}

            {projectAnalysis && Array.isArray(projectAnalysis.improvementAreas) && projectAnalysis.improvementAreas.length > 0 && (
              <Card className="bg-navy-800 border-navy-700 p-6">
                <h3 className="text-xl font-bold mb-4">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-300">
                  {projectAnalysis.improvementAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </Card>
            )}

          </div>

          <div className="space-y-6">
            <Card className="bg-navy-800 border-purple-500/30 border p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-4">Take Action</h3>
              <div className="space-y-3">
                {renderGuidanceButton()}
                
                <Button 
                  variant="secondary" 
                  className="w-full bg-navy-700 hover:bg-navy-600 text-purple-300 border border-purple-500/30" 
                  onClick={async () => {
                    const reason = prompt("Enter your reason/purpose for requesting detailed technical project access:");
                    if (!reason) return;
                    try {
                      const { requestProjectAccess } = await import('@/services/access');
                      await requestProjectAccess({
                        projectId,
                        projectTitle: project.title,
                        studentId: project.studentId || project.uploaded_by || 'student_demo_user',
                        mentorId: currentUser?.uid || 'mentor_demo_user',
                        mentorName: userProfile?.displayName || 'Mentor User',
                        reason
                      });
                      alert("Detailed access request submitted to student! You will be notified upon approval.");
                    } catch(err) {
                      console.error("Error requesting access:", err);
                      alert("Access request logged.");
                    }
                  }}
                >
                  🔒 Request Detailed Access
                </Button>

                <Button 
                  variant="outline" 
                  className={`w-full ${isSaved ? 'text-purple-400 border-purple-500/50' : 'text-gray-300'}`}
                  onClick={handleToggleSave}
                  icon={isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                >
                  {isSaved ? 'Saved to Bookmarks' : 'Save Project'}
                </Button>
              </div>

              {supportNeedsList.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Looking for support with:</h4>
                  <div className="flex flex-wrap gap-2">
                    {supportNeedsList.map(need => {
                      const stLabel = typeof need === 'string' ? (SUPPORT_TYPES.find(t => t.value === need)?.label || need) : (need?.label || 'Support');
                      return <Badge key={String(need)} variant="outline" className="text-xs">{stLabel}</Badge>
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card className="bg-navy-800 border-navy-700 p-6">
              <h3 className="text-lg font-bold mb-4">Lifecycle Stage</h3>
              <LifecycleTimeline currentStage={stageText} />
            </Card>

            {Array.isArray(projectEvidence) && projectEvidence.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-4">Evidence & Validation</h3>
                <div className="space-y-4">
                  {projectEvidence.map(evidence => (
                    <EvidenceCard key={evidence.id} evidence={evidence} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Guidance / Offer Support Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="bg-navy-800 border-navy-700 p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-purple-400" />
              Request to Guide This Project
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              You are sending a mentorship request to the student team of <strong>{project.title}</strong>.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type of Guidance / Support</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                >
                  <option value="" disabled>Select guidance type</option>
                  {SUPPORT_TYPES.map(t => <option key={t.value} value={t.label || t.value}>{t.label}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message to Student</label>
                <textarea 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[120px]"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Introduce yourself and explain how you can help guide this project..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSupportModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSendSupport}
                disabled={submittingSupport || !supportType}
              >
                {submittingSupport ? <LoadingSpinner size="sm" /> : 'Send Guidance Request'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
