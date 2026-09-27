import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GitCommit, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LifecycleTimeline from '@/components/project/LifecycleTimeline';
import { getStudentProjects } from '@/services/projects';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default function ProjectLifecyclePage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const data = await getStudentProjects(currentUser.uid);
        setProjects(data);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [currentUser]);

  useEffect(() => {
    async function fetchEvents() {
      if (!selectedProjectId) return;
      try {
        setEventsLoading(true);
        const q = query(
          collection(db, 'projectLifecycle'),
          where('projectId', '==', selectedProjectId),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const evts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(evts);
      } catch (err) {
        console.error("Error fetching lifecycle events:", err);
      } finally {
        setEventsLoading(false);
      }
    }
    fetchEvents();
  }, [selectedProjectId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<GitCommit className="w-16 h-16 text-gray-500" />}
          title="No Projects Yet"
          description="Upload a project to start tracking its lifecycle journey."
        />
      </div>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GitCommit className="text-purple-500" /> Lifecycle Tracker
        </h1>
        
        <div className="w-full md:w-64">
          <select 
            className="w-full bg-navy-800 border border-navy-600 rounded-md p-2 text-white outline-none focus:border-blue-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-navy-800 border-navy-700 p-6 min-h-[400px]">
            {eventsLoading ? (
              <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
            ) : events.length > 0 ? (
              <LifecycleTimeline events={events} currentStage={selectedProject?.lifecycleStage} />
            ) : (
              <EmptyState 
                icon={<AlertCircle className="w-12 h-12 text-gray-500" />}
                title="No Events Found"
                description="No lifecycle events recorded for this project yet."
              />
            )}
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-navy-800 border-navy-700 p-6">
            <h3 className="text-lg font-bold mb-4">Current Status</h3>
            <div className="text-center p-6 bg-navy-900 rounded-lg border border-navy-700 mb-6">
              <span className="text-sm text-gray-400 block mb-2">Stage</span>
              <Badge className="bg-purple-900/50 text-purple-300 text-lg py-1 px-4">
                {selectedProject?.lifecycleStage || 'Unknown'}
              </Badge>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-300 border-b border-navy-700 pb-2">What happens next?</h4>
              <p className="text-sm text-gray-400">
                Continue developing your project and updating your documentation. As you add more evidence and achieve higher scores, your project will naturally progress to the next lifecycle stage, unlocking new mentorship and funding opportunities.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
