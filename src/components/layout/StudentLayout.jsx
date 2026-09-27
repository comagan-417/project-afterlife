import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  User, 
  ChevronRight, 
  LayoutDashboard, 
  FolderOpen, 
  Upload, 
  Brain, 
  Target, 
  TrendingUp, 
  GitBranch, 
  Handshake, 
  Users,
  Shield,
  Key,
  BarChart,
  Zap
} from 'lucide-react';
import { getInitials } from '@/utils/helpers';
import { db } from '@/firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function StudentLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real unread notification count
  useEffect(() => {
    const syncUnread = async () => {
      try {
        if (!currentUser) return setUnreadCount(0);
        const { getNotifications } = await import('@/services/notifications');
        const notifs = await getNotifications(currentUser.id || currentUser.uid, 'student');
        const unread = notifs.filter(n => !n.read && !n.is_read).length;
        setUnreadCount(unread);
      } catch (e) {
        setUnreadCount(0);
      }
    };
    syncUnread();
    window.addEventListener('notifications_updated', syncUnread);
    return () => window.removeEventListener('notifications_updated', syncUnread);
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'My Projects', path: '/student/projects', icon: FolderOpen },
    { name: 'Upload Project', path: '/student/upload', icon: Upload },
    { name: 'Active Mentorship', path: '/student/mentorships', icon: Handshake },
    { name: 'Project Security', path: '/student/security', icon: Shield },
    { name: 'Evaluation', path: '/student/evaluation', icon: BarChart },
    { name: 'Notifications', path: '/student/notifications', icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="flex h-screen bg-navy-900 text-white overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-800 border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link to="/student/dashboard" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Zap className="w-6 h-6 text-blue-500 fill-blue-500" />
            <span>PROJECT AFTERLIFE</span>
          </Link>
          <button 
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`sidebar-item flex items-center justify-between ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500 rounded-r-none' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {getInitials(userProfile?.displayName || currentUser?.email || 'User')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {userProfile?.displayName || 'Student User'}
              </p>
              <p className="text-xs text-gray-400 capitalize truncate">
                {userProfile?.role || 'Student'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header / Topbar */}
        <header className="h-16 bg-navy-800 border-b border-white/10 flex items-center justify-between px-4 lg:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <Link to="/student/notifications" className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-navy-900 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

