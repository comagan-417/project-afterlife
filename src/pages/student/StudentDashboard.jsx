import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Activity, 
  Star, 
  Users, 
  Upload, 
  BarChart2, 
  Search,
  Bell,
  Handshake,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ScoreRing from '@/components/ui/ScoreRing';
import { getStudentProjects } from '@/services/projects';
import { getNotifications } from '@/services/notifications';
import { getStudentConnections, acceptGuidanceRequest, declineGuidanceRequest } from '@/services/connections';
import { timeAgo, formatDate } from '@/utils/helpers';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [mentorshipRequests, setMentorshipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    analyzed: 0,
    avgScore: 0,
    activeMentorships: 0
  });

  const loadDashboardData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const studentId = currentUser.id || currentUser.uid;
      const userProjects = await getStudentProjects(studentId);
      const userNotifs = await getNotifications(studentId, 'student');
      const conns = await getStudentConnections(studentId).catch(() => []);
      
      setProjects((userProjects || []).slice(0, 4));
      setNotifications((userNotifs || []).slice(0, 3));
      setMentorshipRequests(conns || []);

      // Calculate stats
      const withScores = userProjects.filter(p => p.score > 0);
      const avg = withScores.length > 0 
        ? withScores.reduce((acc, curr) => acc + curr.score, 0) / withScores.length 
        : 0;
      
      const activeConns = conns.filter(c => {
        const s = (c.status || '').toLowerCase();
        return s === 'active' || s === 'accepted';
      });

      setStats({
        totalProjects: userProjects.length,
        analyzed: withScores.length,
        avgScore: Math.round(avg),
        activeMentorships: activeConns.length
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    window.addEventListener('notifications_updated', loadDashboardData);
    window.addEventListener('connections_updated', loadDashboardData);
    window.addEventListener('projects_updated', loadDashboardData);
    return () => {
      window.removeEventListener('notifications_updated', loadDashboardData);
      window.removeEventListener('connections_updated', loadDashboardData);
      window.removeEventListener('projects_updated', loadDashboardData);
    };
  }, [currentUser]);

  const handleAcceptRequest = async (requestId, mentorName, projectTitle) => {
    try {
      setActionLoading(requestId);
      setActionMessage(null);
      await acceptGuidanceRequest(requestId);
      setActionMessage({ type: 'success', text: `Accepted mentorship from ${mentorName} for "${projectTitle}".` });
      await loadDashboardData();
    } catch (err) {
      console.error("Error accepting mentorship:", err);
      setActionMessage({ type: 'error', text: 'Failed to accept guidance request. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId, mentorName) => {
    try {
      setActionLoading(requestId);
      setActionMessage(null);
      await declineGuidanceRequest(requestId);
      setActionMessage({ type: 'info', text: `Declined mentorship request from ${mentorName}.` });
      await loadDashboardData();
    } catch (err) {
      console.error("Error declining mentorship:", err);
      setActionMessage({ type: 'error', text: 'Failed to decline guidance request.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const pendingRequests = mentorshipRequests.filter(r => (r.status || '').toLowerCase() === 'pending');
  const otherRequests = mentorshipRequests.filter(r => (r.status || '').toLowerCase() !== 'pending');

  return (
    <div className="space-y-8 bg-navy-900 text-white min-h-screen p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.displayName || currentUser?.name || 'Student'}</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your innovations, track AI evaluations, and review mentor guidance requests.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => navigate('/student/upload')} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload Project
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
          actionMessage.type === 'success' ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-200' :
          actionMessage.type === 'info' ? 'bg-blue-900/40 border border-blue-500/50 text-blue-200' :
          'bg-red-900/40 border border-red-500/50 text-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-navy-800 border-navy-700 p-4 flex items-center">
          <div className="p-3 bg-blue-500/20 rounded-lg mr-4 text-blue-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Projects</p>
            <p className="text-2xl font-bold">{stats.totalProjects}</p>
          </div>
        </Card>
        <Card 
          className="bg-navy-800 border-navy-700 p-4 flex items-center cursor-pointer hover:border-purple-500/50 transition-colors"
          onClick={() => navigate('/student/mentorships')}
        >
          <div className="p-3 bg-purple-500/20 rounded-lg mr-4 text-purple-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Active Mentorships</p>
            <p className="text-2xl font-bold">{stats.activeMentorships}</p>
          </div>
        </Card>
        <Card 
          className="bg-navy-800 border-navy-700 p-4 flex items-center cursor-pointer hover:border-green-500/50 transition-colors"
          onClick={() => {
            const firstProjId = projects[0]?.id;
            navigate(firstProjId ? `/student/score?projectId=${firstProjId}` : '/student/score');
          }}
        >
          <div className="p-3 bg-green-500/20 rounded-lg mr-4 text-green-400">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Avg Score</p>
            <p className="text-2xl font-bold">{stats.avgScore}</p>
          </div>
        </Card>
      </div>

      {/* Incoming Mentorship Requests Section (Requirement 4) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Handshake className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Mentorship Requests</h2>
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-900/60 text-amber-300 border border-amber-500/40">
                {pendingRequests.length} Pending
              </Badge>
            )}
          </div>
          <Link to="/student/mentorships" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            View All ({mentorshipRequests.length})
          </Link>
        </div>

        {mentorshipRequests.length === 0 ? (
          <Card className="bg-navy-800 border-navy-700 p-6 text-center text-gray-400 text-sm">
            <Handshake className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-60" />
            <p className="font-medium text-gray-300">No mentorship requests yet</p>
            <p className="text-xs text-gray-500 mt-1">When mentors or industry experts offer to guide your projects, their requests will appear here.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.concat(otherRequests).slice(0, 4).map(req => {
              const isPending = (req.status || '').toLowerCase() === 'pending';
              const isAccepted = (req.status || '').toLowerCase() === 'accepted' || (req.status || '').toLowerCase() === 'active';
              const isDeclined = (req.status || '').toLowerCase() === 'declined' || (req.status || '').toLowerCase() === 'rejected';

              return (
                <Card 
                  key={req.id} 
                  className={`bg-navy-800 border p-5 transition-all ${
                    isPending ? 'border-amber-500/40 shadow-lg shadow-amber-950/20' :
                    isAccepted ? 'border-emerald-500/30' :
                    'border-navy-700 opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">Mentor: {req.mentorName || 'Industry Mentor'}</span>
                      </div>
                      {req.mentorOrganization && (
                        <p className="text-xs text-gray-400 mt-0.5">{req.mentorOrganization}</p>
                      )}
                    </div>
                    <div>
                      {isPending && (
                        <Badge className="bg-amber-900/50 text-amber-300 border border-amber-500/40 text-xs">
                          Status: Pending
                        </Badge>
                      )}
                      {isAccepted && (
                        <Badge className="bg-emerald-900/50 text-emerald-300 border border-emerald-500/40 text-xs">
                          Status: Accepted
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge className="bg-red-900/40 text-red-400 border border-red-500/30 text-xs">
                          Status: Declined
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-300 bg-navy-900/70 p-3 rounded-lg border border-white/5 mb-4">
                    {req.mentorDomain && (
                      <div><span className="text-gray-400">Domain:</span> <span className="text-purple-300 font-medium">{req.mentorDomain}</span></div>
                    )}
                    {req.supportType && (
                      <div><span className="text-gray-400">Interest / Support:</span> <span className="text-blue-300">{req.supportType}</span></div>
                    )}
                    {Array.isArray(req.mentorSkills) && req.mentorSkills.length > 0 && (
                      <div><span className="text-gray-400">Skills:</span> {req.mentorSkills.join(', ')}</div>
                    )}
                    <div className="pt-1 border-t border-white/10 mt-1">
                      <span className="text-gray-400">Project:</span> <strong className="text-white">{req.projectTitle || 'Assigned Project'}</strong>
                      {req.projectId && <span className="text-gray-500 ml-1 text-[11px]">({req.projectId})</span>}
                    </div>
                    {req.message && (
                      <div className="mt-1 italic text-gray-400">"{req.message}"</div>
                    )}
                    <div className="text-[11px] text-gray-500 pt-1">
                      Requested: {formatDate(req.createdAt)}
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 pt-2 border-t border-navy-700">
                      <Button
                        size="sm"
                        disabled={actionLoading === req.id}
                        onClick={() => handleAcceptRequest(req.id, req.mentorName, req.projectTitle)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1 flex items-center justify-center gap-1 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actionLoading === req.id}
                        onClick={() => handleDeclineRequest(req.id, req.mentorName)}
                        className="text-red-400 border border-red-500/30 hover:bg-red-950/30 flex-1 flex items-center justify-center gap-1 text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">My Projects</h2>
            <Link to="/student/projects" className="text-blue-400 hover:text-blue-300 text-sm font-medium">View All</Link>
          </div>
          
          {projects.length === 0 ? (
            <EmptyState 
              icon={<FolderOpen className="w-12 h-12 text-gray-500" />}
              title="No projects yet"
              description="Upload your first project to get started and showcase your work."
              action={<Button onClick={() => navigate('/student/upload')}>Upload Project</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(project => (
                <Card 
                  key={project.id} 
                  className="bg-navy-800 border-navy-700 hover:border-blue-500 transition-colors p-5 cursor-pointer flex flex-col justify-between" 
                  onClick={() => navigate(`/student/score?projectId=${project.id}`)}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg line-clamp-1">{project.title}</h3>
                      {project.score > 0 && <ScoreRing score={project.score} size="sm" />}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge className="bg-navy-700 text-gray-300">{project.domain}</Badge>
                      <Badge className="bg-blue-900/50 text-blue-400">{project.lifecycleStage}</Badge>
                    </div>
                    {project.assignedMentor && (
                      <div className="mb-3 p-2 rounded bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300">
                        <strong>Mentor Assigned:</strong> {project.assignedMentor.name} {project.assignedMentor.domain ? `(${project.assignedMentor.domain})` : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t border-navy-700/50">
                    Uploaded {timeAgo(project.createdAt)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Notifications & Quick Actions */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Notifications</h2>
              <Link to="/student/notifications" className="text-blue-400 hover:text-blue-300 text-sm">All</Link>
            </div>
            
            <Card className="bg-navy-800 border-navy-700 p-0 divide-y divide-navy-700">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-4 flex gap-3 hover:bg-navy-750 transition-colors">
                    <div className="mt-1">
                      {(notif.type === 'evaluation_complete' || notif.type === 'analysis_complete') && <Activity className="w-4 h-4 text-green-400" />}
                      {(notif.type === 'mentorship_request' || notif.type === 'connection_request') && <Users className="w-4 h-4 text-purple-400" />}
                      {notif.type === 'mentorship_accepted' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {notif.type === 'mentorship_declined' && <XCircle className="w-4 h-4 text-red-400" />}
                      {notif.type === 'system' && <Bell className="w-4 h-4 text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{notif.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-gray-500 mt-2 block">{timeAgo(notif.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-navy-700 hover:bg-navy-800" 
                onClick={() => {
                  const firstProjId = projects[0]?.id;
                  navigate(firstProjId ? `/student/score?projectId=${firstProjId}` : '/student/score');
                }}
              >
                <BarChart2 className="w-4 h-4 mr-3 text-cyan-400" />
                View Project Score
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-navy-700 hover:bg-navy-800" 
                onClick={() => navigate('/student/mentorships')}
              >
                <Handshake className="w-4 h-4 mr-3 text-purple-400" />
                Manage Mentorship Requests
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
