import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentConnections, acceptGuidanceRequest, declineGuidanceRequest } from '@/services/connections';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Handshake, User, Check, X, Clock, MessageSquare, Briefcase, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function MentorshipRequests() {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const conns = await getStudentConnections(currentUser?.id || currentUser?.uid);
      setConnections(conns || []);
    } catch (err) {
      console.error("Error fetching mentorship connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    window.addEventListener('connections_updated', fetchConnections);
    return () => window.removeEventListener('connections_updated', fetchConnections);
  }, [currentUser]);

  const handleAccept = async (connId, mentorName, projectTitle) => {
    try {
      setActionLoading(connId);
      setNotification(null);
      await acceptGuidanceRequest(connId);
      setNotification({ type: 'success', message: `Mentorship accepted! ${mentorName} is now assigned to "${projectTitle}".` });
      await fetchConnections();
    } catch (err) {
      console.error("Error accepting mentorship:", err);
      setNotification({ type: 'error', message: "Failed to accept mentorship request. Please try again." });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (connId, mentorName) => {
    try {
      setActionLoading(connId);
      setNotification(null);
      await declineGuidanceRequest(connId);
      setNotification({ type: 'info', message: `Declined mentorship request from ${mentorName}.` });
      await fetchConnections();
    } catch (err) {
      console.error("Error declining mentorship:", err);
      setNotification({ type: 'error', message: "Failed to decline mentorship request." });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading mentorship requests..." />;
  }

  const activeConnections = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'active' || s === 'accepted';
  });
  const pendingConnections = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'pending' || s === 'requested';
  });
  const historyConnections = connections.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s === 'declined' || s === 'rejected' || s === 'completed';
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Handshake className="w-8 h-8 text-purple-400" />
          Mentorship Requests & Guidance
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Review incoming guidance offers from verified mentors, investors, and industrialists for your projects.
        </p>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm ${
          notification.type === 'success' ? 'bg-emerald-900/40 border border-emerald-500/50 text-emerald-200' :
          notification.type === 'info' ? 'bg-blue-900/40 border border-blue-500/50 text-blue-200' :
          'bg-red-900/40 border border-red-500/50 text-red-200'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Pending Guidance Requests */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          <span>Incoming Mentorship Requests</span>
          <Badge className="bg-amber-900/60 text-amber-300 border border-amber-500/40">{pendingConnections.length}</Badge>
        </h2>

        {pendingConnections.length === 0 ? (
          <Card className="text-center py-8 text-gray-400 text-sm bg-navy-800/80 border-navy-700">
            No pending guidance requests currently.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingConnections.map(conn => (
              <Card key={conn.id} className="bg-navy-800 border-amber-500/40 p-5 shadow-lg shadow-amber-950/20">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <span>Mentor: {conn.mentorName || 'Industry Mentor'}</span>
                        </h3>
                        {conn.mentorOrganization && (
                          <p className="text-xs text-gray-400">{conn.mentorOrganization}</p>
                        )}
                      </div>
                      <Badge className="bg-amber-900/50 text-amber-300 border border-amber-500/40 text-xs">
                        Status: Pending
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-navy-900/70 p-3 rounded-lg border border-white/5">
                      {conn.mentorDomain && (
                        <div><span className="text-gray-400">Domain:</span> <span className="text-purple-300 font-medium">{conn.mentorDomain}</span></div>
                      )}
                      {conn.supportType && (
                        <div><span className="text-gray-400">Interest / Guidance Type:</span> <span className="text-blue-300 font-medium">{conn.supportType}</span></div>
                      )}
                      {Array.isArray(conn.mentorSkills) && conn.mentorSkills.length > 0 && (
                        <div className="sm:col-span-2"><span className="text-gray-400">Skills / Expertise:</span> {conn.mentorSkills.join(', ')}</div>
                      )}
                      {conn.mentorBio && (
                        <div className="sm:col-span-2 text-gray-300 italic"><span className="text-gray-400 not-italic">Bio:</span> {conn.mentorBio}</div>
                      )}
                    </div>

                    <div className="text-xs text-gray-300 pt-1">
                      <div><span className="text-gray-400">Project:</span> <strong className="text-white text-sm">{conn.projectTitle || 'Assigned Project'}</strong> {conn.projectId && <span className="text-gray-500">({conn.projectId})</span>}</div>
                      {conn.message && (
                        <div className="mt-2 p-2.5 bg-navy-900 rounded border border-white/5 italic text-gray-300">
                          "{conn.message}"
                        </div>
                      )}
                      <div className="text-[11px] text-gray-500 mt-2">
                        Received: {formatDate(conn.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 shrink-0 md:min-w-[140px] pt-2 md:pt-0">
                    <Button
                      size="sm"
                      disabled={actionLoading === conn.id}
                      onClick={() => handleAccept(conn.id, conn.mentorName, conn.projectTitle)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white w-full flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionLoading === conn.id}
                      onClick={() => handleDecline(conn.id, conn.mentorName)}
                      className="text-red-400 border border-red-500/30 hover:bg-red-950/30 w-full flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Mentorships */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>Active Mentorships</span>
          <Badge className="bg-emerald-900/50 text-emerald-400 border border-emerald-500/30">{activeConnections.length}</Badge>
        </h2>

        {activeConnections.length === 0 ? (
          <Card className="text-center py-6 text-gray-400 text-sm bg-navy-800/80 border-navy-700">
            No active mentors assigned yet. Accepted guidance requests will appear here.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeConnections.map(conn => (
              <Card key={conn.id} className="bg-navy-800 border-emerald-500/40 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
                      {conn.mentorName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <div className="font-bold text-white text-base">{conn.mentorName || 'Industry Mentor'}</div>
                      <div className="text-xs text-gray-400">{conn.mentorOrganization || conn.mentorDomain || 'Mentor'}</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">ASSIGNED MENTOR</Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-300 space-y-1 bg-navy-900/50 p-3 rounded-lg">
                  <div><span className="text-gray-400">Project:</span> <strong className="text-white">{conn.projectTitle || 'Assigned Project'}</strong></div>
                  {conn.mentorDomain && <div><span className="text-gray-400">Domain:</span> {conn.mentorDomain}</div>}
                  {conn.supportType && <div><span className="text-gray-400">Guidance Type:</span> {conn.supportType}</div>}
                  <div className="text-gray-500 text-[11px] pt-1">Mentoring Since: {formatDate(conn.updatedAt || conn.createdAt)}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past / Declined Requests */}
      {historyConnections.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-500" />
            <span>Past & Declined Requests</span>
            <Badge className="bg-navy-700 text-gray-400">{historyConnections.length}</Badge>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
            {historyConnections.map(conn => (
              <Card key={conn.id} className="bg-navy-800/60 border-navy-700 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-gray-300 text-sm">{conn.mentorName}</div>
                  <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-700 text-xs">
                    {conn.status?.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">Project: {conn.projectTitle}</p>
                <p className="text-[11px] text-gray-500 mt-1">Date: {formatDate(conn.updatedAt || conn.createdAt)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
