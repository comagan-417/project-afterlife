import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProjects, updateProject } from '@/services/projects';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Award, CheckCircle, Target, Layers, FileText, Cpu, Activity, BarChart, Save } from 'lucide-react';

const EVAL_CRITERIA = [
  { id: 'problemDefinition', name: 'Problem Definition', weight: 10, icon: Target, desc: 'Clarity of real-world problem statement and target domain applicability.' },
  { id: 'designArchitecture', name: 'Design & Architecture', weight: 15, icon: Layers, desc: 'System architecture, block diagrams, component selection & schema design.' },
  { id: 'implementation', name: 'Implementation', weight: 25, icon: Cpu, desc: 'Hardware assembly, firmware, core software development & code quality.' },
  { id: 'testingValidation', name: 'Testing & Validation', weight: 20, icon: Activity, desc: 'Experimental testing, sensor calibration, bug fixes & edge-case validation.' },
  { id: 'documentation', name: 'Documentation', weight: 10, icon: FileText, desc: 'Technical documentation, circuit schematics, user manual & repository structure.' },
  { id: 'innovationApp', name: 'Innovation & Application', weight: 10, icon: Award, desc: 'Novelty of approach, patentability, practical industry / societal impact.' },
  { id: 'demonstration', name: 'Demonstration', weight: 10, icon: CheckCircle, desc: 'Working prototype demo, video walk-through, hardware response & execution.' }
];

export function mapScoreToStatus(score) {
  if (score <= 20) return 'IDEA';
  if (score <= 40) return 'PLANNING';
  if (score <= 60) return 'DEVELOPMENT';
  if (score <= 80) return 'TESTING / PROTOTYPE';
  if (score < 100) return 'NEAR COMPLETION';
  return 'COMPLETED';
}

export default function EvaluationPage() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      const studentId = currentUser?.uid || 'student_demo_user';
      try {
        setLoading(true);
        const userProjects = await getStudentProjects(studentId);
        setProjects(userProjects);
        if (userProjects.length > 0) {
          const urlParams = new URLSearchParams(window.location.search);
          const targetId = urlParams.get('projectId');
          const found = userProjects.find(p => p.id === targetId);
          selectProject(found || userProjects[0]);
        }
      } catch (err) {
        console.error("Error loading evaluation projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [currentUser]);

  const selectProject = (proj) => {
    setSelectedProject(proj);
    const existingEval = proj.evaluation || {};
    setScores(existingEval.scores || {
      problemDefinition: 8,
      designArchitecture: 12,
      implementation: 18,
      testingValidation: 14,
      documentation: 8,
      innovationApp: 7,
      demonstration: 8
    });
    setFeedback(existingEval.feedback || 'Project exhibits strong hardware-software integration with room for expanded testing.');
  };

  const calculateTotalScore = () => {
    return Object.values(scores).reduce((acc, val) => acc + (Number(val) || 0), 0);
  };

  const handleScoreChange = (criterionId, val, maxWeight) => {
    const num = Math.min(Math.max(0, Number(val) || 0), maxWeight);
    setScores(prev => ({ ...prev, [criterionId]: num }));
  };

  const handleSaveEvaluation = async () => {
    if (!selectedProject) return;
    try {
      setSaving(true);
      const totalScore = calculateTotalScore();
      const statusMapped = mapScoreToStatus(totalScore);

      const evaluationData = {
        scores,
        totalScore,
        maxScore: 100,
        statusMapped,
        feedback,
        updatedAt: new Date().toISOString()
      };

      await updateProject(selectedProject.id, {
        evaluation: evaluationData,
        completionPercentage: totalScore,
        developmentStatus: statusMapped
      });

      setSelectedProject(prev => ({
        ...prev,
        evaluation: evaluationData,
        completionPercentage: totalScore,
        developmentStatus: statusMapped
      }));

      alert(`Evaluation updated! Score: ${totalScore}/100. Status mapped to: ${statusMapped}`);
    } catch (err) {
      console.error("Error saving evaluation:", err);
      alert("Failed to save evaluation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading project evaluation engine..." />;
  }

  const totalScore = calculateTotalScore();
  const currentStatus = mapScoreToStatus(totalScore);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart className="w-7 h-7 text-amber-500" />
            Project Evaluation & Rubric System
          </h1>
          <p className="text-gray-400 text-sm">
            Measurable 100-point evaluation engine. Project status dynamically maps to completion percentage.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <Award className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Projects Available for Evaluation</h3>
          <p className="text-gray-400 text-sm mt-1 mb-4">Upload a project to submit it for evaluation.</p>
          <Button onClick={() => navigate('/student/upload')}>Upload Project</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Project Selector & Overall Score Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Project</h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => selectProject(proj)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedProject?.id === proj.id
                        ? 'bg-amber-600/20 border-amber-500 text-white'
                        : 'bg-navy-900/60 border-white/10 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-sm truncate">{proj.title || 'Untitled Project'}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                      <span>{proj.developmentStatus || 'IDEA'}</span>
                      <span>•</span>
                      <span className="text-amber-400 font-bold">{proj.completionPercentage || proj.evaluation?.totalScore || 0}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Overall Evaluation Summary Card */}
            <Card className="border-amber-500/30 text-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Evaluation Score</h3>
              <div className="relative inline-flex items-center justify-center my-4">
                <div className="w-32 h-32 rounded-full border-4 border-amber-500/30 flex items-center justify-center bg-amber-950/20">
                  <div>
                    <span className="text-4xl font-extrabold text-amber-400">{totalScore}</span>
                    <span className="text-sm text-gray-400 block font-semibold">/ 100%</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <div className="text-xs text-gray-400">Mapped Project Status:</div>
                <Badge className="bg-amber-900/60 text-amber-300 border border-amber-500/40 px-3 py-1 text-sm font-bold">
                  {currentStatus}
                </Badge>
              </div>

              {/* Status Mapping Scale */}
              <div className="mt-6 pt-4 border-t border-white/10 text-left text-xs space-y-1">
                <div className="text-gray-400 font-bold mb-2">Status Thresholds:</div>
                <div className="flex justify-between text-gray-400"><span>0–20%:</span> <span className="text-white">IDEA</span></div>
                <div className="flex justify-between text-gray-400"><span>21–40%:</span> <span className="text-white">PLANNING</span></div>
                <div className="flex justify-between text-gray-400"><span>41–60%:</span> <span className="text-white">DEVELOPMENT</span></div>
                <div className="flex justify-between text-gray-400"><span>61–80%:</span> <span className="text-white">TESTING / PROTOTYPE</span></div>
                <div className="flex justify-between text-gray-400"><span>81–99%:</span> <span className="text-white">NEAR COMPLETION</span></div>
                <div className="flex justify-between text-gray-400"><span>100%:</span> <span className="text-emerald-400 font-bold">COMPLETED</span></div>
              </div>
            </Card>
          </div>

          {/* Right Column: 7 Criteria Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white">Criterion Score Breakdown</h2>
                  <p className="text-xs text-gray-400">Adjust scores to update evaluation criteria (Max total = 100 points)</p>
                </div>
                <Button
                  onClick={handleSaveEvaluation}
                  disabled={saving}
                  className="bg-amber-600 hover:bg-amber-500 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Evaluation'}
                </Button>
              </div>

              <div className="space-y-4">
                {EVAL_CRITERIA.map((crit) => {
                  const Icon = crit.icon;
                  const currentScore = scores[crit.id] || 0;
                  return (
                    <div key={crit.id} className="p-4 bg-navy-900/60 border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{crit.name}</div>
                            <div className="text-xs text-gray-400">{crit.desc}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={crit.weight}
                            value={currentScore}
                            onChange={(e) => handleScoreChange(crit.id, e.target.value, crit.weight)}
                            className="w-16 bg-navy-800 border border-white/20 rounded-lg px-2 py-1 text-center font-bold text-amber-400 text-sm"
                          />
                          <span className="text-xs text-gray-400 font-semibold">/ {crit.weight}%</span>
                        </div>
                      </div>

                      {/* Progress Bar for Criterion */}
                      <div className="w-full bg-navy-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${(currentScore / crit.weight) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Qualitative Evaluator Feedback */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                <label className="block text-sm font-semibold text-white">Evaluator Notes & Feedback</label>
                <textarea
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter detailed evaluation feedback and improvement suggestions..."
                  className="w-full bg-navy-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
