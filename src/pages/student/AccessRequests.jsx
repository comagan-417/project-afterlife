import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessRequests, approveAccessRequest, rejectAccessRequest, revokeAccess } from '@/services/access';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Key, Check, X, Clock, ShieldAlert, Ban, User, Calendar } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function AccessRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [duration, setDuration] = useState(24);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const reqs = await getAccessRequests(currentUser?.uid || 'student_demo_user', 'student');
      setRequests(reqs);
    } catch (err) {
      console.error("Error fetching access requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    window.addEventListener('access_requests_updated', fetchRequests);
    return () => window.removeEventListener('access_requests_updated', fetchRequests);
  }, [currentUser]);

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(requestId);
      await approveAccessRequest(requestId, duration);
      await fetchRequests();
      alert(`Access granted for ${duration} hours.`);
    } catch (err) {
      console.error("Error approving request:", err);
      alert("Failed to approve access request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoading(requestId);
      await rejectAccessRequest(requestId, 'Student declined access request.');
      await fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert("Failed to reject access request.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (requestId) => {
    try {
      setActionLoading(requestId);
      await revokeAccess(requestId);
      await fetchRequests();
      alert("Access granted previously has been revoked.");
    } catch (err) {
      console.error("Error revoking access:", err);
      alert("Failed to revoke access.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading access requests..." />;
  }

  const pendingRequests = requests.filter(r => (r.status || '').toUpperCase() === 'PENDING');
  const activeGrants = requests.filter(r => (r.status || '').toUpperCase() === 'APPROVED');
  const historyRequests = requests.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s !== 'PENDING' && s !== 'APPROVED';
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Key className="w-7 h-7 text-purple-500" />
          Project Access Control
        </h1>
        <p className="text-gray-400 text-sm">
          Review detailed project access requests from verified mentors, grant temporary signed access, or revoke permissions anytime.
        </p>
      </div>

      {/* Grant Duration Selector */}
      <Card className="bg-navy-800/80 border-purple-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-sm">Default Access Expiration Duration</h3>
            <p className="text-gray-400 text-xs">Set temporary access window for approved mentor access links.</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: '24 Hours', val: 24 },
              { label: '3 Days', val: 72 },
              { label: '7 Days', val: 168 }
            ].map(item => (
              <button
                key={item.val}
                onClick={() => setDuration(item.val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  duration === item.val
                    ? 'bg-purple-600 text-white'
                    : 'bg-navy-900 text-gray-400 border border-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Pending Access Requests</span>
          <Badge className="bg-amber-900/50 text-amber-400">{pendingRequests.length}</Badge>
        </h2>

        {pendingRequests.length === 0 ? (
          <Card className="text-center py-8 text-gray-400 text-sm">
            No pending detailed access requests right now.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map(req => (
              <Card key={req.id} className="border-amber-500/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-base">{req.mentorName || 'Verified Mentor'}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Requested access to: <span className="text-white font-medium">"{req.projectTitle}"</span>
                    </p>
                    <p className="text-xs text-gray-300 bg-navy-900 p-2.5 rounded-lg border border-white/10 mt-2">
                      <span className="font-semibold text-gray-400">Request Purpose:</span> {req.reason}
                    </p>
                    <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> Requested on {formatDate(req.requestedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={actionLoading === req.id}
                      onClick={() => handleApprove(req.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      Approve ({duration}h)
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={actionLoading === req.id}
                      onClick={() => handleReject(req.id)}
                      className="text-red-400 hover:bg-red-400/10 border-red-500/30 flex items-center gap-1"
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

      {/* Access History */}
      {historyRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Access Request History</h2>
          <Card>
            <div className="space-y-2">
              {historyRequests.map(req => (
                <div key={req.id} className="p-3 bg-navy-900/50 border border-white/5 rounded-lg text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white">{req.mentorName}</span>
                    <span className="text-gray-400 ml-2">[{req.projectTitle}]</span>
                  </div>
                  <Badge className={
                    req.status === 'REJECTED' ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-400'
                  }>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
