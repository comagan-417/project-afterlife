import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCircle, Clock, AlertCircle, X, Trash2 } from 'lucide-react';
import { LoadingSpinner, Card, EmptyState, Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAsRead, markAllAsRead, dismissNotification, clearReadNotifications } from '@/services/notifications';

export default function MentorNotifications() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'unread'

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      if (!currentUser) return setNotifications([]);
      const data = await getNotifications(currentUser.id || currentUser.uid, 'mentor');
      setNotifications(data || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
    window.addEventListener('notifications_updated', fetchNotifs);
    return () => window.removeEventListener('notifications_updated', fetchNotifs);
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
      await markAllAsRead(currentUser?.uid || 'mentor_demo_user');
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDismiss = async (e, id) => {
    e.stopPropagation();
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await dismissNotification(id);
    } catch (err) {
      console.error("Error dismissing notification:", err);
    }
  };

  const handleClearRead = async () => {
    try {
      setNotifications(prev => prev.filter(n => !n.read && !n.is_read));
      await clearReadNotifications(currentUser?.uid || 'mentor_demo_user');
    } catch (err) {
      console.error("Error clearing read notifications:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read && !notif.is_read) {
      try {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, is_read: true } : n));
        await markAsRead(notif.id);
      } catch (e) {
        console.error(e);
      }
    }
    
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'connection_accepted': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'connection_declined': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Bell className="w-5 h-5 text-purple-400" />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8"><LoadingSpinner /></div>;
  }

  const unreadCount = notifications.filter(n => !n.read && !n.is_read).length;
  const readCount = notifications.length - unreadCount;
  const displayedNotifs = filterMode === 'unread' ? notifications.filter(n => !n.read && !n.is_read) : notifications;

  return (
    <div className="min-h-screen bg-navy-900 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="w-8 h-8 text-purple-400" /> Notifications
            </h1>
            <p className="text-gray-400 mt-1">Updates on your mentorship offers and account</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllRead} className="border-navy-600 text-xs py-1.5">
                Mark all as read
              </Button>
            )}
            {readCount > 0 && (
              <Button variant="ghost" onClick={handleClearRead} className="text-gray-400 hover:text-red-400 text-xs py-1.5 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Clear Read
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-b border-navy-800 pb-3 text-sm">
          <button 
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${filterMode === 'all' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'}`}
          >
            All ({notifications.length})
          </button>
          <button 
            onClick={() => setFilterMode('unread')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${filterMode === 'unread' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-gray-400 hover:text-white'}`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {displayedNotifs.length > 0 ? (
          <div className="space-y-4">
            {displayedNotifs.map(notif => {
              const isUnread = !notif.read && !notif.is_read;
              return (
                <Card 
                  key={notif.id} 
                  className={`p-4 border transition-all cursor-pointer relative group ${isUnread ? 'bg-navy-800 border-purple-500/60 shadow-lg' : 'bg-navy-800/60 border-navy-700 opacity-80'}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-4 items-start">
                    <div className="mt-1 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className={`font-medium ${isUnread ? 'text-white font-semibold' : 'text-gray-300'}`}>{notif.title}</h3>
                        <span className="text-xs text-gray-500 shrink-0">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isUnread ? 'text-gray-200' : 'text-gray-400'}`}>{notif.message}</p>
                    </div>
                    <button 
                      onClick={(e) => handleDismiss(e, notif.id)}
                      className="p-1 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded transition-colors absolute top-3 right-3 opacity-80 group-hover:opacity-100"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={Bell}
            title={filterMode === 'unread' ? "No unread notifications" : "No notifications yet"}
            message={filterMode === 'unread' ? "All notifications have been read." : "When students respond to your mentorship offers, you'll see updates here."}
          />
        )}
      </div>
    </div>
  );
}
