import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { LoadingSpinner, Card, Badge, EmptyState, Button } from '@/components/ui';
import { getUserConnections } from '@/services/connections';
import { getProject } from '@/services/projects';
import { useNavigate } from 'react-router-dom';
import { SUPPORT_TYPES } from '@/utils/constants.js';

export default function MentorshipHistory() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [projectsData, setProjectsData] = useState({});

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      const effectiveId = currentUser.id || currentUser.uid;
      try {
        setLoading(true);
        const conns = await getUserConnections(effectiveId, 'mentor');
        setConnections(conns || []);

        const pData = {};
        for (const c of conns) {
          if (c.projectId && !pData[c.projectId]) {
            const pRes = await getProject(c.projectId);
            if (pRes) {
              pData[c.projectId] = pRes.project || pRes;
            }
          }
        }
        setProjectsData(pData);
      } catch (err) {
        console.error("Error loading mentorships:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.addEventListener('connections_updated', loadData);
    return () => window.removeEventListener('connections_updated', loadData);
  }, [currentUser]);

  const activeMentorships = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'accepted' || s === 'active';
  });
  const pendingRequests = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'requested';
  });
  const pastMentorships = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'completed' || s === 'declined' || s === 'rejected';
  });

  const formatDate = (val) => {
    if (!val) return '';
    try {
      if (typeof val?.toMillis === 'function') return new Date(val.toMillis()).toLocaleDateString();
      return new Date(val).toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const renderConnectionCard = (conn) => {
    const project = projectsData[conn.projectId] || { title: 'Project Details', domain: 'Software' };
    const supportLabel = SUPPORT_TYPES.find(t => t.value === conn.supportType)?.label || conn.supportType || 'Guidance';
    const dateStr = formatDate(conn.updatedAt || conn.createdAt);

    return (
      <Card key={conn.id} className="bg-navy-800 border-navy-700 p-5 hover:border-navy-600 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">{project.title}</h3>
            <div className="flex gap-2">
              <Badge variant="purple" className="text-xs">{project.domain || 'Software'}</Badge>
              <Badge variant="outline" className="text-xs">{supportLabel}</Badge>
            </div>
          </div>
          <div>
            {conn.status === 'accepted' && <Badge variant="green" className="bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">Mentoring This Project</Badge>}
            {conn.status === 'pending' && <Badge variant="outline" className="bg-amber-900/40 text-amber-300 border-amber-600/50">Request Pending</Badge>}
            {conn.status === 'declined' && <Badge variant="outline" className="bg-red-900/40 text-red-400 border-red-600/50">Request Declined</Badge>}
            {conn.status === 'completed' && <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700">Completed</Badge>}
          </div>
        </div>
        
        <div className="text-sm text-gray-400 mb-4 space-y-1">
          <p>Student: <strong className="text-gray-200">{conn.studentName || 'Student Innovator'}</strong> {conn.studentInstitution ? `(${conn.studentInstitution})` : ''}</p>
          {dateStr && <p className="text-xs text-gray-500">Updated: {dateStr}</p>}
          {conn.message && (
            <div className="mt-2 p-3 bg-navy-900 rounded-md italic text-gray-300 text-xs">"{conn.message}"</div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" className="text-purple-400 hover:text-purple-300" onClick={() => navigate(`/mentor/project/${conn.projectId}`)} icon={<ArrowRight className="w-4 h-4" />}>
            View Project
          </Button>
        </div>
      </Card>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-purple-400" /> Mentorships & Connections
          </h1>
          <p className="text-gray-400">Track your active engagements and pending offers.</p>
        </div>

        {connections.length === 0 ? (
          <EmptyState 
            icon={Users}
            title="No mentorships yet"
            message="You haven't offered support to any projects yet. Discover projects to find students who need your expertise."
            action={<Button variant="primary" className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate('/mentor/discover')}>Discover Projects</Button>}
          />
        ) : (
          <div className="space-y-10">
            {activeMentorships.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-navy-700 pb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" /> Active Mentorships
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {activeMentorships.map(renderConnectionCard)}
                </div>
              </div>
            )}

            {pendingRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-navy-700 pb-2">
                  <Clock className="w-5 h-5 text-yellow-400" /> Pending Offers
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {pendingRequests.map(renderConnectionCard)}
                </div>
              </div>
            )}

            {pastMentorships.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-navy-700 pb-2">
                  <XCircle className="w-5 h-5 text-gray-500" /> Past & Declined
                </h2>
                <div className="grid gap-4 md:grid-cols-2 opacity-70">
                  {pastMentorships.map(renderConnectionCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
