import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAccessRequests } from '@/services/access';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Key, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function MentorAccessRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const list = await getAccessRequests(currentUser.uid, 'mentor');
        setRequests(list);
      } catch (err) {
        console.error("Error loading mentor access requests:", err);
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading access requests..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Key className="w-7 h-7 text-purple-500" />
          Detailed Project Access Requests
        </h1>
        <p className="text-gray-400 text-sm">
          Track your requests for detailed technical project material and active temporary signed access links.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="text-center py-12 text-gray-400 text-sm">
          You have not submitted any detailed project access requests yet. Discover student projects and click "Request Detailed Access".
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-purple-500/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg">{req.projectTitle}</span>
                    <Badge className={
                      req.status === 'APPROVED' ? 'bg-emerald-900/60 text-emerald-400' :
                      req.status === 'REJECTED' ? 'bg-red-900/60 text-red-400' :
                      req.status === 'REVOKED' ? 'bg-amber-900/60 text-amber-400' : 'bg-blue-900/60 text-blue-400'
                    }>
                      {req.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-400 mt-1">Requested on: {formatDate(req.requestedAt)}</p>
                  <p className="text-xs text-gray-300 mt-1 bg-navy-900 p-2 rounded border border-white/10">
                    <span className="text-gray-400 font-semibold">Your Note:</span> {req.reason}
                  </p>

                  {req.status === 'APPROVED' && req.expiresAt && (
                    <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Temporary Access Valid Until: {formatDate(req.expiresAt)}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {req.status === 'APPROVED' ? (
                    <Button
                      href={`/mentor/project/${req.projectId}?token=${req.accessToken}`}
                      className="bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Access Detailed Material
                    </Button>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      {req.status === 'PENDING' ? 'Awaiting student approval...' : 'Access restricted'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
