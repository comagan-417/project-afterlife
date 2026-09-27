import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db, functions } from '@/firebase.js';
import { httpsCallable } from 'firebase/functions';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bookmark, Users, Activity, Bell, ChevronRight, User } from 'lucide-react';
import { LoadingSpinner, Button, Card, Badge, EmptyState } from '@/components/ui';
import { ProjectCard } from '@/components/project';
import { getUserConnections } from '@/services/connections';
import { getPublishedProjects } from '@/services/projects';
import { getMentorRecommendationsForProjects } from '@/services/matching';

function withTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms))
  ]);
}

export default function MentorDashboard() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    savedProjects: 0,
    activeMentorships: 0,
    pendingRequests: 0,
    totalMatches: 0
  });
  const [topProjects, setTopProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [guidanceStatusMap, setGuidanceStatusMap] = useState({});

  useEffect(() => {
    async function loadDashboard() {
      if (!currentUser) return;
      const effectiveId = currentUser.id || currentUser.uid;
      try {
        setLoading(true);

        // 1. Load Connections / Mentorship stats
        let activeCount = 0;
        let pendingCount = 0;
        const statusMap = {};
        try {
          const connections = await getUserConnections(effectiveId, 'mentor');
          for (const c of (connections || [])) {
            const pid = c.projectId || c.project_id;
            if (pid) statusMap[pid] = (c.status || '').toLowerCase();
          }
          activeCount = connections.filter(c => c.status === 'accepted' || c.status === 'active').length;
          pendingCount = connections.filter(c => c.status === 'pending').length;
        } catch (e) {
          console.warn("Connections fetch warning:", e);
        }
        setGuidanceStatusMap(statusMap);

        // 2. Load Saved Projects count
        let savedCount = 0;
        try {
          const { getSavedProjects } = await import('@/services/projects');
          const savedList = await getSavedProjects(effectiveId);
          savedCount = (savedList || []).length;
        } catch (e) {
          console.warn("Saved projects fetch warning:", e);
        }

        // 3. Load top matched projects
        let matches = [];
        try {
          const allPublished = await getPublishedProjects();
          const recs = await getMentorRecommendationsForProjects(effectiveId, userProfile || {}, allPublished);
          matches = (recs || []).slice(0, 3).map(r => ({
            ...r.project,
            matchPercentage: r.matchScore,
            matchReason: r.matchExplanation
          }));
        } catch (e) {
          console.warn("Recommendations error:", e);
        }

        setTopProjects(matches);
        setStats({
          savedProjects: savedCount,
          activeMentorships: activeCount,
          pendingRequests: pendingCount,
          totalMatches: matches.length
        });

        // 4. Load notifications
        try {
          const { getNotifications } = await import('@/services/notifications');
          const notifs = await getNotifications(effectiveId, 'mentor');
          setNotifications((notifs || []).slice(0, 3));
        } catch (e) {
          setNotifications([]);
        }

      } catch (err) {
        console.error("Failed to load mentor dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
    window.addEventListener('connections_updated', loadDashboard);
    return () => window.removeEventListener('connections_updated', loadDashboard);
  }, [currentUser, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8">
        <LoadingSpinner fullscreen size="lg" text="Loading Mentor Dashboard..." />
      </div>
    );
  }

  const roleText = typeof userProfile?.mentorRole === 'string' ? userProfile.mentorRole : (userProfile?.role || 'Mentor');
  const orgText = typeof userProfile?.organization === 'string' ? userProfile.organization : '';
  const displayName = userProfile?.firstName || userProfile?.displayName || 'Mentor';
  const profileIncomplete = !userProfile?.skills?.length || !userProfile?.supportTypesOffered?.length;

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {displayName}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="purple" className="capitalize">{roleText}</Badge>
              {orgText && <span className="text-gray-400 text-sm">{orgText}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/mentor/discover')} icon={<Search className="w-4 h-4" />}>
              Discover Projects
            </Button>
          </div>
        </div>

        {profileIncomplete && (
          <Card className="bg-purple-900/20 border-purple-500/30 p-4 flex items-start gap-4">
            <User className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-purple-300">Complete your profile to get better matches</h3>
              <p className="text-sm text-gray-300 mt-1">Our AI uses your skills, domains, and interests to find the most relevant projects for you to mentor or support.</p>
            </div>
            <Button variant="primary" onClick={() => navigate('/mentor/profile')} className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white">
              Edit Profile
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-navy-800 border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-gray-400 font-medium text-sm">Active Mentorships</h3>
            </div>
            <div className="text-3xl font-bold">{stats.activeMentorships}</div>
          </Card>
          <Card className="p-4 bg-navy-800 border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-gray-400 font-medium text-sm">Pending Requests</h3>
            </div>
            <div className="text-3xl font-bold">{stats.pendingRequests}</div>
          </Card>
          <Card className="p-4 bg-navy-800 border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-5 h-5 text-purple-400" />
              <h3 className="text-gray-400 font-medium text-sm">Saved Projects</h3>
            </div>
            <div className="text-3xl font-bold">{stats.savedProjects}</div>
          </Card>
          <Card className="p-4 bg-navy-800 border-navy-700">
            <div className="flex items-center gap-3 mb-2">
              <Search className="w-5 h-5 text-purple-400" />
              <h3 className="text-gray-400 font-medium text-sm">Total Matches</h3>
            </div>
            <div className="text-3xl font-bold">{stats.totalMatches}</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" /> Top Matched Projects
              </h2>
              <Link to="/mentor/discover" className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            {topProjects.length > 0 ? (
              <div className="grid gap-4">
                {topProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    score={project.score || project.overallScore}
                    matchPercentage={project.matchPercentage || project.matchScore}
                    guidanceStatus={guidanceStatusMap[project.id]}
                    onView={() => navigate(`/mentor/project/${project.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={Search} 
                title="No top matches right now" 
                message="We couldn't find any projects strongly matching your profile right now. Try updating your skills or browse all projects."
                action={<Button variant="outline" onClick={() => navigate('/mentor/discover')}>Browse All Projects</Button>}
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-purple-400" /> Recent Notifications
              </h2>
              <Link to="/mentor/notifications" className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center">
                All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <Card className="bg-navy-800 border-navy-700">
              {notifications.length > 0 ? (
                <div className="divide-y divide-navy-700">
                  {notifications.map(n => (
                    <div key={n.id} className="p-4 hover:bg-navy-750 transition-colors">
                      <h4 className="text-sm font-medium text-gray-200">{n.title}</h4>
                      <p className="text-xs text-gray-400 mt-1">{n.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent notifications</p>
                </div>
              )}
            </Card>

            <h2 className="text-xl font-bold pt-4">Quick Actions</h2>
            <div className="grid gap-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/mentor/saved')}>
                <Bookmark className="w-4 h-4 mr-2" /> View Saved Projects
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/mentor/mentorships')}>
                <Users className="w-4 h-4 mr-2" /> View Active Mentorships
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
