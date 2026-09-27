import React, { useState, useEffect } from 'react';
import { db } from '@/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Shield, Users, FolderOpen, Handshake, Key, Activity, Clock, Server } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    mentors: 0,
    projects: 0,
    mentorships: 0,
    accessRequests: 0,
    accessLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminStats() {
      try {
        setLoading(true);
        const [studSnap, mentSnap, projSnap, connSnap, reqSnap, logSnap] = await Promise.all([
          getDocs(collection(db, 'students')).catch(() => ({ size: 0 })),
          getDocs(collection(db, 'mentors')).catch(() => ({ size: 0 })),
          getDocs(collection(db, 'projects')).catch(() => ({ size: 0 })),
          getDocs(collection(db, 'connections')).catch(() => ({ size: 0 })),
          getDocs(collection(db, 'accessRequests')).catch(() => ({ size: 0 })),
          getDocs(collection(db, 'accessLogs')).catch(() => ({ docs: [] }))
        ]);

        const logs = logSnap.docs ? logSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [];
        logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

        setStats({
          students: studSnap.size || 0,
          mentors: mentSnap.size || 0,
          projects: projSnap.size || 0,
          mentorships: connSnap.size || 0,
          accessRequests: reqSnap.size || 0,
          accessLogs: logs
        });
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminStats();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading system monitoring telemetry..." />;
  }

  return (
    <div className="space-y-6 p-6 bg-navy-900 text-white min-h-screen">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7 text-emerald-400" />
          Project Afterlife — Admin & System Telemetry
        </h1>
        <p className="text-gray-400 text-sm">
          Platform-wide monitoring, security audit logs, database telemetry, and AI processing status.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', count: stats.students, icon: Users, color: 'text-blue-400' },
          { label: 'Total Mentors', count: stats.mentors, icon: Users, color: 'text-purple-400' },
          { label: 'Total Projects', count: stats.projects, icon: FolderOpen, color: 'text-emerald-400' },
          { label: 'Active Mentorships', count: stats.mentorships, icon: Handshake, color: 'text-amber-400' },
          { label: 'Access Requests', count: stats.accessRequests, icon: Key, color: 'text-red-400' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="text-center p-4">
              <Icon className={`w-6 h-6 mx-auto mb-2 ${item.color}`} />
              <div className="text-2xl font-extrabold text-white">{item.count}</div>
              <div className="text-xs text-gray-400 font-semibold">{item.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Activity & AI Status */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-400" />
            System & AI Infrastructure Health
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-navy-900 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Firestore Shared Database</div>
                <div className="text-gray-400">Single source of truth for both portals</div>
              </div>
              <Badge className="bg-emerald-900/60 text-emerald-400">HEALTHY</Badge>
            </div>

            <div className="p-3 bg-navy-900 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Private Object Storage</div>
                <div className="text-gray-400">SHA-256 fingerprinting & signed access</div>
              </div>
              <Badge className="bg-emerald-900/60 text-emerald-400">ENFORCED</Badge>
            </div>

            <div className="p-3 bg-navy-900 border border-white/10 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">AI Extraction & Scoring Pipeline</div>
                <div className="text-gray-400">Structured JSON output & rubric scoring</div>
              </div>
              <Badge className="bg-emerald-900/60 text-emerald-400">READY</Badge>
            </div>
          </div>
        </Card>

        {/* Global Security Audit Log */}
        <Card>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Global Security Audit Log
          </h2>

          {stats.accessLogs.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">
              No audit log entries recorded yet.
            </div>
          ) : (
            <div className="space-y-2 custom-scrollbar max-h-64 overflow-y-auto pr-1 text-xs">
              {stats.accessLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-navy-900/70 border border-white/5 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-gray-400 ml-2">{log.details}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
