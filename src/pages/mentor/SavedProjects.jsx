import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, doc } from 'firebase/firestore';
import { db } from '@/firebase.js';
import { Bookmark, Search } from 'lucide-react';
import { LoadingSpinner, Button, Input, EmptyState } from '@/components/ui';
import { ProjectCard } from '@/components/project';
import { useNavigate } from 'react-router-dom';
import { toggleSaveProject } from '@/services/connections';
import { getProject, getPublishedProjects } from '@/services/projects';

function withTimeout(promise, ms = 1000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms))
  ]);
}

export default function SavedProjects() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadSavedProjects() {
      try {
        setLoading(true);
        let localSaved = [];
        try {
          localSaved = JSON.parse(localStorage.getItem('pa_local_saved_projects') || '[]');
        } catch (e) {}

        // Seed default saved projects if none saved yet
        if (!localStorage.getItem('pa_local_saved_initialized')) {
          localSaved = [
            { projectId: 'proj_healthcare_ai_01', id: 'proj_healthcare_ai_01', savedAt: new Date().toISOString() },
            { projectId: 'proj_cybersecurity_03', id: 'proj_cybersecurity_03', savedAt: new Date().toISOString() }
          ];
          localStorage.setItem('pa_local_saved_projects', JSON.stringify(localSaved));
          localStorage.setItem('pa_local_saved_initialized', 'true');
        }

        const projData = [];
        for (const item of localSaved) {
          const pid = item.projectId || item.id;
          const pRes = await getProject(pid);
          if (pRes) {
            const pObj = pRes.project || pRes;
            if (!projData.some(existing => existing.id === pObj.id)) {
              projData.push({ ...pObj, savedAt: item.savedAt });
            }
          }
        }

        // 2. Try Firestore
        if (currentUser?.uid) {
          try {
            const savedRef = collection(db, 'mentors', currentUser.uid, 'savedProjects');
            const savedSnap = await withTimeout(getDocs(savedRef), 1000);
            for (const savedDoc of savedSnap.docs) {
              if (!projData.some(p => p.id === savedDoc.id)) {
                const pRes = await getProject(savedDoc.id);
                if (pRes) {
                  const pObj = pRes.project || pRes;
                  projData.push({ ...pObj, savedAt: savedDoc.data()?.savedAt });
                }
              }
            }
          } catch (e) {
            console.warn("Firestore saved projects notice:", e);
          }
        }

        setProjects(projData);
      } catch (err) {
        console.error("Error loading saved projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSavedProjects();

    const handleSavedUpdate = () => loadSavedProjects();
    window.addEventListener('saved_projects_updated', handleSavedUpdate);
    return () => window.removeEventListener('saved_projects_updated', handleSavedUpdate);
  }, [currentUser]);

  const handleUnsave = async (projectId) => {
    try {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      await toggleSaveProject(currentUser?.uid, projectId);
    } catch (err) {
      console.error("Error unsaving project:", err);
    }
  };

  const filteredProjects = projects.filter(p => 
    (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.domain || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-navy-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bookmark className="w-8 h-8 text-purple-400" /> Saved Projects
            </h1>
            <p className="text-gray-400 mt-1">Projects you have bookmarked for later review</p>
          </div>
          <div className="w-full md:w-72">
            <Input 
              icon={<Search className="w-5 h-5 text-gray-400" />}
              placeholder="Search saved projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-navy-800 border-navy-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12"><LoadingSpinner /></div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {filteredProjects.map(project => (
              <div key={project.id} className="relative">
                <ProjectCard 
                  project={project}
                  score={project.score || project.overallScore || 80}
                  isSaved={true}
                  onSave={() => handleUnsave(project.id)}
                  onView={() => navigate(`/mentor/project/${project.id}`)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={Bookmark}
            title={projects.length === 0 ? "No saved projects yet" : "No matches found"}
            message={projects.length === 0 ? "Discover projects to save them here for easy access later." : "Try a different search term."}
            action={projects.length === 0 ? <Button variant="primary" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate('/mentor/discover')}>Discover Projects</Button> : null}
          />
        )}
      </div>
    </div>
  );
}
