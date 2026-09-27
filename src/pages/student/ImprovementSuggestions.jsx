import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TrendingUp, AlertCircle, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { getProjectScore } from '@/services/projects';
import { getEvidenceLevelBadge } from '@/utils/helpers';
// Assuming calculateImprovementPotential exists in a scoringEngine or we mock its logic here
// For this implementation we'll calculate it inline if not imported

export default function ImprovementSuggestions() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const navigate = useNavigate();
  
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchScore = async () => {
      try {
        setLoading(true);
        const data = await getProjectScore(projectId);
        setScoreData(data);
      } catch (err) {
        console.error("Error fetching score:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScore();
  }, [projectId]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!projectId) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-gray-500" />}
          title="No Project Selected"
          description="Please select a project to view its improvement suggestions."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  if (!scoreData || !scoreData.criteria) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<TrendingUp className="w-16 h-16 text-gray-500" />}
          title="No data available"
          description="Complete project analysis and scoring first to see improvement suggestions."
          action={<Button onClick={() => navigate(`/student/score?projectId=${projectId}`)}>View Scorecard</Button>}
        />
      </div>
    );
  }

  // Calculate gaps and sort by impact
  const suggestions = Object.entries(scoreData.criteria)
    .map(([key, criterion]) => {
      const maxScore = criterion.maxScore || 10;
      const currentScore = criterion.score || 0;
      const gap = maxScore - currentScore;
      
      // Generate a recommendation based on evidence level if one isn't provided
      let recommendation = criterion.recommendation;
      if (!recommendation) {
        if (criterion.evidenceLevel === 'NONE' || !criterion.evidenceLevel) {
          recommendation = `Provide explicit documentation or proof for ${criterion.name} to increase this score. Currently no solid evidence was found.`;
        } else if (criterion.evidenceLevel === 'LOW' || criterion.evidenceLevel === 'WEAK') {
          recommendation = `Current evidence for ${criterion.name} is weak. Provide concrete examples, code, or verified links to strengthen it.`;
        } else {
          recommendation = `Minor improvements can be made to ${criterion.name} by providing more detailed metrics or verified third-party validations.`;
        }
      }

      return {
        id: key,
        name: criterion.name,
        currentScore,
        maxScore,
        gap,
        evidenceLevel: criterion.evidenceLevel,
        recommendation
      };
    })
    .filter(item => item.gap > 0)
    .sort((a, b) => b.gap - a.gap);

  const totalPotential = scoreData.totalScore + suggestions.reduce((acc, curr) => acc + curr.gap, 0);
  const potentialGain = totalPotential - scoreData.totalScore;

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="text-green-400" /> Improvement Suggestions
          </h1>
          <p className="text-gray-400 mt-2">Targeted recommendations based on your current evidence gaps.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/student/score?projectId=${projectId}`)}>Back to Score</Button>
      </div>

      <Card className="bg-navy-800 border-navy-700 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <h2 className="text-xl text-gray-300 mb-2">Score Potential</h2>
        <div className="flex items-center justify-center text-4xl font-bold gap-4 mb-4">
          <span className="text-white">{scoreData.totalScore}/100</span>
          <span className="text-gray-500 text-2xl">→</span>
          <span className="text-green-400">{totalPotential}/100</span>
        </div>
        <Badge className="bg-green-900/50 text-green-400 text-sm px-3 py-1">
          Total Potential Gain: +{potentialGain} points
        </Badge>
      </Card>

      {suggestions.length === 0 ? (
        <Card className="bg-navy-800 border-navy-700 p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Incredible Work!</h3>
          <p className="text-gray-400">Your project has achieved maximum confidence across all criteria. There are no major evidence gaps to fill.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Action Items (Sorted by Impact)</h3>
          
          <div className="space-y-4">
            {suggestions.map((item, index) => (
              <Card key={item.id} className="bg-navy-800 border-navy-700 overflow-hidden p-0">
                <div 
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-navy-750 transition-colors"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-center gap-4 flex-grow">
                    <div className="w-8 h-8 rounded-full bg-navy-900 flex items-center justify-center text-gray-400 font-bold border border-navy-600">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">Current: {item.currentScore}/{item.maxScore}</span>
                        <div className="w-32 h-1.5 bg-navy-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(item.currentScore / item.maxScore) * 100}%` }}
                          ></div>
                        </div>
                        <Badge className="bg-green-900/30 text-green-400 border border-green-800/50 ml-2">+{item.gap} pts</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block">
                      {getEvidenceLevelBadge(item.evidenceLevel || 'NONE')}
                    </div>
                    {expandedItems[item.id] ? <ChevronDown className="text-gray-400" /> : <ChevronRight className="text-gray-400" />}
                  </div>
                </div>
                
                {expandedItems[item.id] && (
                  <div className="p-5 bg-navy-900/50 border-t border-navy-700 animate-in slide-in-from-top-2">
                    <h5 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">Recommendation</h5>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{item.recommendation}</p>
                    
                    <h5 className="text-sm font-medium text-gray-300 mb-2 uppercase tracking-wider">What to do next</h5>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-gray-400">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        Update your project description or add links to relevant materials
                      </li>
                      <li className="flex items-start gap-2 text-sm text-gray-400">
                        <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                        Re-trigger AI analysis once the new information is added
                      </li>
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
