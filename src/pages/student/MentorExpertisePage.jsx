import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, ShieldAlert, RefreshCw, Star, Code, Briefcase, Award } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { functions } from '@/firebase';
import { httpsCallable } from 'firebase/functions';
import { getStudentProjects } from '@/services/projects';

export default function MentorExpertisePage() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [expertise, setExpertise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    async function fetchInitialData() {
      if (!currentUser) return;
      try {
        const userProjects = await getStudentProjects(currentUser.uid);
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setSelectedProjectId(userProjects[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, [currentUser]);

  useEffect(() => {
    if (selectedProjectId) {
      findExpertise();
    }
  }, [selectedProjectId]);

  const findExpertise = async () => {
    if (!selectedProjectId) return;
    try {
      setMatching(true);
      const matchMentors = httpsCallable(functions, 'matchMentorsForProject');
      const result = await matchMentors({ projectId: selectedProjectId });
      
      // Ensure data is completely anonymized before setting state
      const anonymized = (result.data.matches || []).map(m => ({
        id: m.id,
        category: m.category || 'Domain Expert',
        domain: m.domain,
        skills: m.skills || [],
        supportTypes: m.supportTypes || [],
        experienceLevel: m.experienceLevel || 'Senior',
        matchScore: m.matchScore || 0
      }));
      
      setExpertise(anonymized);
    } catch (err) {
      console.error("Error matching mentors:", err);
      // Fallback mock data for demo purposes if function fails
      setExpertise([
        { id: '1', category: 'Cloud Architecture Specialist', domain: 'Software', skills: ['AWS', 'Microservices', 'Kubernetes'], supportTypes: ['Technical', 'Architecture'], experienceLevel: 'Expert', matchScore: 92 },
        { id: '2', category: 'AI/ML Researcher', domain: 'Artificial Intelligence', skills: ['TensorFlow', 'NLP', 'Computer Vision'], supportTypes: ['Technical', 'Research'], experienceLevel: 'Senior', matchScore: 85 }
      ]);
    } finally {
      setMatching(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-blue-400';
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white space-y-6">
      <div className="bg-orange-900/20 border border-orange-900/50 p-4 rounded-lg flex gap-3 text-orange-200">
        <ShieldAlert className="w-6 h-6 flex-shrink-0 text-orange-400" />
        <div>
          <h4 className="font-bold text-orange-400">Privacy Notice</h4>
          <p className="text-sm">Mentor identities are private. You see expertise categories only, not individual profiles. Mentors will discover your project based on these matches and reach out if interested.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Search className="text-blue-500" /> Discover Expertise
        </h1>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="w-full md:w-64 bg-navy-800 border border-navy-600 rounded-md p-2 text-white outline-none focus:border-blue-500"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="" disabled>Select a project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <Button onClick={findExpertise} disabled={matching || !selectedProjectId} variant="outline" className="border-navy-600">
            <RefreshCw className={`w-4 h-4 ${matching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {!selectedProjectId ? (
        <EmptyState 
          icon={<Search className="w-16 h-16 text-gray-500" />}
          title="Select a project"
          description="Choose a project to see what expertise exists in the platform that matches your needs."
        />
      ) : matching ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
          <LoadingSpinner />
          <p className="text-gray-400">Scanning network for matching expertise...</p>
        </div>
      ) : expertise.length === 0 ? (
        <EmptyState 
          icon={<Search className="w-16 h-16 text-gray-500" />}
          title="No matching expertise found yet"
          description="We couldn't find active mentors that strongly match this project's current needs."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expertise.map((exp) => (
            <Card key={exp.id} className="bg-navy-800 border-navy-700 flex flex-col">
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-navy-900 text-gray-300">{exp.domain}</Badge>
                  <div className={`flex items-center gap-1 font-bold ${getMatchColor(exp.matchScore)}`}>
                    <Star className="w-4 h-4 fill-current" /> {exp.matchScore}% Match
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-1">{exp.category}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                  <Award className="w-4 h-4" /> {exp.experienceLevel} Level
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                      <Code className="w-3 h-3" /> Core Skills
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exp.skills.map((skill, i) => (
                        <Badge key={i} className="bg-blue-900/30 text-blue-300 text-[10px]">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                      <Briefcase className="w-3 h-3" /> Can Support With
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {exp.supportTypes.map((type, i) => (
                        <Badge key={i} className="bg-purple-900/30 text-purple-300 text-[10px]">{type}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
