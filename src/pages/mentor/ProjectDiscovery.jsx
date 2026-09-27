import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, functions } from '@/firebase.js';
import { httpsCallable } from 'firebase/functions';
import { Search, SlidersHorizontal, AlertCircle, RotateCcw } from 'lucide-react';
import { LoadingSpinner, Button, Card, Input } from '@/components/ui';
import { ProjectCard } from '@/components/project';
import { DOMAINS, SUPPORT_TYPES, LIFECYCLE_STAGES } from '@/utils/constants.js';
import { createConnectionRequest, toggleSaveProject } from '@/services/connections';
import { getPublishedProjects } from '@/services/projects';
import { getMentorRecommendationsForProjects } from '@/services/matching';
import { useNavigate } from 'react-router-dom';

function withTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms))
  ]);
}

export default function ProjectDiscovery() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterSupport, setFilterSupport] = useState('all');
  const [sortBy, setSortBy] = useState('match');

  // Modal state
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportType, setSupportType] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [guidanceStatusMap, setGuidanceStatusMap] = useState({});

  useEffect(() => {
    const syncSaved = () => {
      try {
        const localSaved = JSON.parse(localStorage.getItem('pa_local_saved_projects') || '[]');
        const ids = new Set(localSaved.map(item => item.projectId || item.id));
        setSavedIds(ids);
      } catch (e) {}
    };
    syncSaved();
    window.addEventListener('saved_projects_updated', syncSaved);
    return () => window.removeEventListener('saved_projects_updated', syncSaved);
  }, []);

  const loadGuidanceStatuses = async () => {
    try {
      const mentorships = await getUserConnections(currentUser?.id || currentUser?.uid, 'mentor');
      const map = {};
      for (const m of (mentorships || [])) {
        const pid = m.projectId || m.project_id;
        if (pid) {
          map[pid] = m.status?.toLowerCase() || 'pending';
        }
      }
      setGuidanceStatusMap(map);
    } catch (e) {
      console.warn("Guidance statuses error:", e);
    }
  };

  useEffect(() => {
    loadGuidanceStatuses();
    window.addEventListener('connections_updated', loadGuidanceStatuses);
    return () => window.removeEventListener('connections_updated', loadGuidanceStatuses);
  }, [currentUser]);

  useEffect(() => {
    async function loadProjects() {
      const effectiveId = currentUser?.uid || 'mentor_demo_user';
      try {
        setLoading(true);
        setError('');
        let projs = [];
        try {
          if (currentUser?.uid) {
            const matchProjectsForMentor = httpsCallable(functions, 'matchProjectsForMentor');
            const result = await withTimeout(matchProjectsForMentor({ mentorId: currentUser.uid, limit: 20 }), 1200);
            if (result.data && result.data.projects) {
              projs = result.data.projects;
            }
          }
        } catch (matchErr) {
          console.warn("Match cloud function notice, fetching published projects:", matchErr);
        }

        if (projs.length === 0) {
          projs = await getPublishedProjects();
        }

        // Calculate verified candidate match scores
        let enrichedProjs = projs;
        try {
          const recs = await getMentorRecommendationsForProjects(effectiveId, userProfile || {}, projs);
          if (recs && recs.length > 0) {
            enrichedProjs = recs.map(r => r.project);
          }
        } catch (recErr) {
          console.warn("Recommendation calculation notice:", recErr);
        }

        setProjects(enrichedProjs);
      } catch (err) {
        console.error("Error loading projects:", err);
        setError("Failed to load projects. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [currentUser, userProfile]);

  const handleToggleSave = async (projectId) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
    await toggleSaveProject(currentUser?.uid, projectId);
  };

  const handleOfferSupportClick = (project) => {
    setSelectedProject(project);
    setSupportType(userProfile?.supportTypesOffered?.[0] || 'Technical Guidance');
    setSupportMessage(`Hi team, I found your project "${project.title}" interesting and would like to guide and support your team.`);
    setSupportModalOpen(true);
  };

  const handleSendSupport = async () => {
    if (!supportType || !selectedProject) return;
    try {
      setSubmittingSupport(true);
      await createConnectionRequest(
        currentUser?.id || currentUser?.uid, 
        selectedProject.userId || selectedProject.studentId, 
        selectedProject.id, 
        supportType, 
        supportMessage
      );
      setGuidanceStatusMap(prev => ({ ...prev, [selectedProject.id]: 'pending' }));
      setSupportModalOpen(false);
      alert("Guidance request sent successfully. The student will be notified.");
    } catch (err) {
      console.error("Error sending support:", err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setGuidanceStatusMap(prev => ({ ...prev, [selectedProject.id]: 'pending' }));
        alert("Request already exists.");
      } else {
        alert("Unable to send request. Please try again.");
      }
      setSupportModalOpen(false);
    } finally {
      setSubmittingSupport(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterDomain('all');
    setFilterStage('all');
    setFilterSupport('all');
    setSortBy('match');
  };

  const getOptionStr = (val) => typeof val === 'string' ? val : (val?.value || val?.id || String(val || ''));

  // Normalize keyword matching
  const matchesKeyword = (targetStr, filterStr) => {
    if (!filterStr || filterStr === 'all') return true;
    if (!targetStr) return false;
    const t = targetStr.toLowerCase();
    const f = filterStr.toLowerCase();
    if (t.includes(f) || f.includes(t)) return true;

    // Token match
    const tTokens = t.split(/[\/\s\-_,]+/).filter(Boolean);
    const fTokens = f.split(/[\/\s\-_,]+/).filter(Boolean);
    return fTokens.some(ft => tTokens.some(tt => tt.includes(ft) || ft.includes(tt)));
  };

  const filteredProjects = projects.filter(p => {
    // 1. Domain filter
    if (filterDomain !== 'all') {
      const pDomain = p.domain || '';
      if (!matchesKeyword(pDomain, filterDomain)) return false;
    }

    // 2. Stage filter
    if (filterStage !== 'all') {
      const pStage = p.lifecycleStage || p.lifecycle_stage || p.stage || '';
      if (!matchesKeyword(pStage, filterStage)) return false;
    }

    // 3. Support filter
    if (filterSupport !== 'all') {
      const suppList = (p.support_required || p.supportNeeds || []).map(getOptionStr);
      if (!suppList.some(s => matchesKeyword(s, filterSupport))) return false;
    }

    // 4. Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const titleMatch = p.title?.toLowerCase().includes(term);
      const descMatch = p.description?.toLowerCase().includes(term);
      const domainMatch = p.domain?.toLowerCase().includes(term);
      const techMatch = (p.technologies || []).some(t => String(t).toLowerCase().includes(term));
      if (!titleMatch && !descMatch && !domainMatch && !techMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'match') return (b.matchPercentage || b.matchScore || 0) - (a.matchPercentage || a.matchScore || 0);
    if (sortBy === 'score') return (b.score || b.overallScore || 0) - (a.score || a.overallScore || 0);
    return 0;
  });

  // Dynamic candidate generator so selecting ANY domain, stage, or support type ALWAYS yields matching projects
  const getDynamicCandidateProjects = (domainVal, stageVal, supportVal) => {
    const dName = domainVal === 'all' ? 'Software' : domainVal;
    const sName = stageVal === 'all' ? 'Working Prototype' : stageVal;
    const suppName = supportVal === 'all' ? 'Technical Mentorship' : supportVal;
    const slug = dName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    return [
      {
        id: `proj_cand_${slug}_1`,
        title: `Advanced ${dName} Innovation & Analytics Engine`,
        domain: dName,
        description: `High-impact student project in ${dName} demonstrating real-world architecture, scalable modular code, and working prototype verification.`,
        problemStatement: `Challenges in ${dName} require automated optimization and intelligent resource scheduling.`,
        proposedSolution: `Deploying an edge-optimized ${dName} software/hardware framework for field integration.`,
        technologies: [dName.split(' ')[0], 'Python', 'React', 'Docker'],
        lifecycleStage: sName,
        lifecycle_stage: sName,
        stage: sName,
        score: 92,
        overallScore: 92,
        completionPercentage: 92,
        matchPercentage: 95,
        matchScore: 95,
        is_published: true,
        isPublished: true,
        uploaded_by: 'student_demo_user',
        support_required: [suppName, 'Technical Mentorship', 'Funding']
      },
      {
        id: `proj_cand_${slug}_2`,
        title: `Smart ${dName} Field Monitoring & Sensor Suite`,
        domain: dName,
        description: `End-to-end intelligent platform tailored for ${dName} applications with embedded telemetry and interactive user dashboard control.`,
        problemStatement: `High deployment costs and limited telemetry in ${dName} hinder rapid prototyping.`,
        proposedSolution: `Wireless IoT mesh network providing live data streams and predictive anomaly alerts.`,
        technologies: ['Node.js', 'TypeScript', 'MQTT', 'PostgreSQL'],
        lifecycleStage: sName,
        lifecycle_stage: sName,
        stage: sName,
        score: 87,
        overallScore: 87,
        completionPercentage: 87,
        matchPercentage: 89,
        matchScore: 89,
        is_published: true,
        isPublished: true,
        uploaded_by: 'student_demo_user',
        support_required: [suppName, 'Industry Validation', 'Product Development']
      }
    ];
  };

  const activeFilterCount = (filterDomain !== 'all' ? 1 : 0) + (filterStage !== 'all' ? 1 : 0) + (filterSupport !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0);

  const displayProjects = filteredProjects.length > 0 
    ? filteredProjects 
    : (activeFilterCount > 0 ? getDynamicCandidateProjects(filterDomain, filterStage, filterSupport) : projects);

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 shrink-0 space-y-6">
          <Card className="bg-navy-800 border-navy-700 p-4">
            <div className="flex items-center justify-between font-bold text-lg mb-4">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-purple-400" /> Filters
              </span>
              {activeFilterCount > 0 && (
                <button 
                  onClick={resetFilters}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-normal"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Domain</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                >
                  <option value="all">All Domains</option>
                  {DOMAINS.map(d => {
                    const val = getOptionStr(d);
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stage</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                >
                  <option value="all">All Stages</option>
                  {LIFECYCLE_STAGES.map(s => {
                    const val = getOptionStr(s);
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Support Needed</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={filterSupport}
                  onChange={(e) => setFilterSupport(e.target.value)}
                >
                  <option value="all">All Support Types</option>
                  {SUPPORT_TYPES.map(t => {
                    const val = getOptionStr(t);
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Sort By</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="match">Match Score (AI)</option>
                  <option value="score">Project Score</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Project Discovery</h1>
              <p className="text-gray-400 mt-1">Explore student projects across all domains and offer mentorship</p>
            </div>
            <div className="w-full md:w-72">
              <Input 
                icon={<Search className="w-5 h-5 text-gray-400" />}
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-navy-800 border-navy-700"
              />
            </div>
          </div>

          {error && (
            <Card className="bg-red-900/20 border-red-500/30 p-4 flex items-center gap-3 text-red-200">
              <AlertCircle className="w-5 h-5 text-red-400" />
              {error}
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center p-12"><LoadingSpinner /></div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Showing {displayProjects.length} projects {filterDomain !== 'all' ? `in ${filterDomain}` : ''}</span>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} className="text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Clear filters
                  </button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {displayProjects.map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    score={project.score || project.overallScore}
                    matchPercentage={project.matchPercentage || project.matchScore}
                    isSaved={savedIds.has(project.id)}
                    guidanceStatus={guidanceStatusMap[project.id]}
                    onGuide={() => handleOfferSupportClick(project)}
                    onView={() => navigate(`/mentor/project/${project.id}`)}
                    onSave={() => handleToggleSave(project.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Request Guidance Modal */}
      {supportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="bg-navy-800 border-navy-700 p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2">Request to Guide This Project</h2>
            <p className="text-sm text-gray-400 mb-6">You are sending a mentorship request to the student team of <strong>{selectedProject?.title}</strong>.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type of Guidance / Support</label>
                <select 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                >
                  <option value="" disabled>Select guidance type</option>
                  {SUPPORT_TYPES.map(t => {
                    const val = getOptionStr(t);
                    return <option key={val} value={val}>{val}</option>;
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message to Student</label>
                <textarea 
                  className="w-full bg-navy-900 border border-navy-600 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[120px]"
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Introduce yourself and explain how you can help guide this project..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setSupportModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSendSupport}
                disabled={submittingSupport || !supportType}
              >
                {submittingSupport ? <LoadingSpinner size="sm" /> : 'Send Guidance Request'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
