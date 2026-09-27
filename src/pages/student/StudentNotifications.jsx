import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, X, Info, Users, Activity, Star } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { db } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { timeAgo } from '@/utils/helpers';

import { getNotifications, markAsRead, markAllAsRead, dismissNotification } from '@/services/notifications';
import { acceptMentorshipConnection } from '@/services/connections';

export default function StudentNotifications() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      if (!currentUser) return setNotifications([]);
      const notifs = await getNotifications(currentUser.id || currentUser.uid, 'student');
      setNotifications(notifs || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs(true);
    const onUpdate = () => fetchNotifs(false);
    window.addEventListener('notifications_updated', onUpdate);
    return () => window.removeEventListener('notifications_updated', onUpdate);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
    await markAllAsRead(currentUser?.uid || 'student_demo_user');
  };

  const handleAcceptConnection = async (notif) => {
    const notifId = notif.id;
    const docId = notif._docId || notif.id;

    // 1. Instant optimistic UI removal: Card vanishes immediately without latency!
    setNotifications(prev => prev.filter(n => n.id !== notifId && n.id !== docId && n._docId !== docId));

    // 2. Persist dismissal immediately
    dismissNotification(notifId, docId);

    // 3. Provision mentorship connection & project access grant
    try {
      await acceptMentorshipConnection({
        connectionId: `conn_${notifId}`,
        projectId: notif.projectId || 'proj_healthcare_ai_01',
        projectTitle: notif.projectTitle || 'Autonomous AI Diagnostic & Triage System',
        studentId: currentUser?.uid || 'student_demo_user',
        mentorId: notif.mentorId || notif.senderId || 'mentor_sarah_lin',
        mentorName: notif.mentorName || 'Dr. Sarah Lin (AI Healthcare Specialist)',
        supportType: notif.supportType || 'Technical Mentorship'
      });
    } catch (err) {
      console.warn("Notice during mentorship acceptance provisioning:", err);
    }
  };

  const handleDeclineConnection = async (notif) => {
    const notifId = typeof notif === 'object' ? notif.id : notif;
    const docId = typeof notif === 'object' ? (notif._docId || notif.id) : notif;
    setNotifications(prev => prev.filter(n => n.id !== notifId && n.id !== docId && n._docId !== docId));
    dismissNotification(notifId, docId);
  };

  const handleDismiss = async (notif) => {
    const notifId = typeof notif === 'object' ? notif.id : notif;
    const docId = typeof notif === 'object' ? (notif._docId || notif.id) : notif;
    setNotifications(prev => prev.filter(n => n.id !== notifId && n.id !== docId && n._docId !== docId));
    dismissNotification(notifId, docId);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'analysis_complete': return <Activity className="w-5 h-5 text-green-400" />;
      case 'connection_request': return <Users className="w-5 h-5 text-purple-400" />;
      case 'score_update': return <Star className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  // Group by date logic (Today, Yesterday, Earlier) simplified for brevity
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bell className="text-blue-500" /> Notifications
        </h1>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" onClick={handleMarkAllRead} className="border-navy-600 text-sm py-1.5">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState 
          icon={<Bell className="w-16 h-16 text-gray-500" />}
          title="No notifications yet"
          description="You're all caught up! When things happen with your projects, you'll see them here."
        />
      ) : (
        <div className="space-y-4">
          {notifications.map(notif => (
            <Card key={notif.id} className={`bg-navy-800 border-navy-700 p-4 transition-colors relative ${!notif.read ? 'bg-navy-800 border-blue-900/50' : ''}`}>
              <div className="flex gap-4">
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-grow pr-6">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-medium ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                  
                  {notif.type === 'connection_request' && !notif.actionTaken && (
                    <div className="flex gap-3 mt-4">
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1 px-4 flex items-center gap-1.5"
                        onClick={() => handleAcceptConnection(notif)}
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-red-500/40 text-red-400 hover:bg-red-500/10 py-1 px-4 flex items-center gap-1.5"
                        onClick={() => handleDeclineConnection(notif)}
                      >
                        <X className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                  {notif.actionTaken && (
                    <p className="text-xs text-gray-500 mt-3 italic">
                      You {notif.actionTaken} this request.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleDismiss(notif)}
                    className="text-gray-500 hover:text-gray-300 p-1 rounded hover:bg-white/5 transition-colors"
                    title="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
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
