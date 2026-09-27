import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, RefreshCw, FileText, Cpu, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import EvidenceCard from '@/components/project/EvidenceCard';
import { triggerAnalysis, getProjectAnalysis } from '@/services/analysis';
import { formatDate, getEvidenceLevelBadge } from '@/utils/helpers';
import { useAuth } from '@/contexts/AuthContext';

export default function AIAnalysis() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { currentUser } = useAuth();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalysis = async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectAnalysis(projectId);
      setAnalysis(data);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      setError("Failed to load analysis data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [projectId]);

  const handleReanalyze = async () => {
    if (!projectId) return;
    try {
      setAnalyzing(true);
      await triggerAnalysis(projectId);
      // Simulating a wait for completion or optimistic update
      setTimeout(() => {
        fetchAnalysis();
        setAnalyzing(false);
      }, 3000);
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Failed to trigger re-analysis");
      setAnalyzing(false);
    }
  };

  if (!projectId) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-gray-500" />}
          title="No Project Selected"
          description="Please select a project from your dashboard to view its AI analysis."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-red-500" />}
          title="Error Loading Analysis"
          description={error}
          action={<Button onClick={fetchAnalysis}>Try Again</Button>}
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<Activity className="w-16 h-16 text-gray-500" />}
          title="No analysis available"
          description="This project hasn't been analyzed by the AI engine yet."
          action={<Button onClick={handleReanalyze} disabled={analyzing}>{analyzing ? 'Starting...' : 'Trigger Analysis'}</Button>}
        />
      </div>
    );
  }

  if (analysis.analysis_status === 'pending') {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white flex flex-col items-center justify-center">
        <div className="text-center max-w-md p-8 bg-navy-800 rounded-xl border border-navy-700 shadow-2xl">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-navy-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            <Cpu className="absolute inset-0 m-auto w-10 h-10 text-blue-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2">AI Analysis in Progress</h2>
          <p className="text-gray-400 mb-6">Our deterministic reasoning engine is evaluating your project documentation, code, and context.</p>
          <p className="text-sm text-blue-400 bg-blue-900/20 py-2 px-4 rounded-lg inline-block">You will be notified when complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-blue-500" /> AI Analysis Results
          </h1>
          <p className="text-gray-400 mt-1">
            Generated on {formatDate(analysis.completed_at)} • Engine v{analysis.version || '1.0'}
          </p>
        </div>
        <Button onClick={handleReanalyze} disabled={analyzing} variant="outline" className="border-navy-600">
          <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Re-analyzing...' : 'Re-analyze Project'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extracted Fields */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-navy-800 border-navy-700 p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center border-b border-navy-700 pb-2">
              <FileText className="w-5 h-5 mr-2 text-cyan-400" /> Extracted Metadata
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase">Project Type</span>
                <div className="mt-1"><Badge className="bg-purple-900/50 text-purple-300">{analysis.extracted_data?.project_type || 'Unknown'}</Badge></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase">Domain</span>
                  <p className="font-medium text-sm">{analysis.extracted_data?.domain || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase">Sub-domain</span>
                  <p className="font-medium text-sm">{analysis.extracted_data?.sub_domain || 'N/A'}</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 uppercase">Development Stage</span>
                <p className="font-medium text-sm">{analysis.extracted_data?.development_stage || 'N/A'}</p>
              </div>

              <div>
                <span className="text-xs text-gray-500 uppercase">Target Users</span>
                <p className="text-sm text-gray-300">{analysis.extracted_data?.target_users || 'Not explicitly stated'}</p>
              </div>

              <div>
                <span className="text-xs text-gray-500 uppercase">Identified Technologies</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.extracted_data?.technologies?.map((tech, i) => (
                    <Badge key={i} className="bg-navy-700 text-xs">{tech}</Badge>
                  ))}
                  {(!analysis.extracted_data?.technologies || analysis.extracted_data.technologies.length === 0) && (
                    <span className="text-sm text-gray-500">None extracted</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 uppercase">Components</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {analysis.extracted_data?.components?.map((comp, i) => (
                    <Badge key={i} className="bg-navy-700 text-xs">{comp}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Evidence List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-4">Evidence & Reasoning</h3>
          
          {analysis.evidence && analysis.evidence.length > 0 ? (
            <div className="space-y-4">
              {analysis.evidence.map((item, idx) => (
                <EvidenceCard 
                  key={idx}
                  field={item.field}
                  value={item.value}
                  source={item.source}
                  level={item.level}
                  reasoning={item.reasoning}
                />
              ))}
            </div>
          ) : (
            <div className="bg-navy-800 p-8 rounded-xl border border-navy-700 text-center">
              <p className="text-gray-400">No specific evidence items were extracted during this analysis run.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
