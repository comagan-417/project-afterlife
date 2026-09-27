import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { HeartHandshake, AlertCircle, DollarSign, Cpu, Briefcase, Users, Code } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';

export default function SupportRequirements() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchRequirements = async () => {
      try {
        setLoading(true);
        // Assuming requirements are stored in a collection or as part of project analysis
        // Mocking it based on standard structure for this implementation
        const docRef = doc(db, 'supportRequirements', projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setRequirements(docSnap.data());
        } else {
          // Fallback or empty state handled below
          setRequirements({ items: [] });
        }
      } catch (err) {
        console.error("Error fetching support requirements:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequirements();
  }, [projectId]);

  if (!projectId) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-gray-500" />}
          title="No Project Selected"
          description="Select a project to view its support requirements."
        />
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-[500px] bg-navy-900"><LoadingSpinner /></div>;
  }

  if (!requirements || !requirements.items || requirements.items.length === 0) {
    return (
      <div className="p-6 bg-navy-900 min-h-screen text-white">
        <EmptyState 
          icon={<HeartHandshake className="w-16 h-16 text-gray-500" />}
          title="No Support Requirements Identified"
          description="The AI hasn't identified specific support needs for this project yet. Try re-analyzing with more detailed descriptions of your roadblocks."
        />
      </div>
    );
  }

  const getIconForType = (type) => {
    switch(type.toLowerCase()) {
      case 'funding': return <DollarSign className="w-6 h-6 text-green-400" />;
      case 'technical': return <Code className="w-6 h-6 text-blue-400" />;
      case 'hardware': return <Cpu className="w-6 h-6 text-orange-400" />;
      case 'industry': return <Briefcase className="w-6 h-6 text-purple-400" />;
      case 'team': return <Users className="w-6 h-6 text-cyan-400" />;
      default: return <HeartHandshake className="w-6 h-6 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'bg-red-900/50 text-red-400 border-red-800/50';
      case 'medium': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800/50';
      case 'low': return 'bg-green-900/50 text-green-400 border-green-800/50';
      default: return 'bg-gray-800 text-gray-300 border-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'looking for support': return 'bg-blue-900/30 text-blue-300';
      case 'in progress': return 'bg-yellow-900/30 text-yellow-300';
      case 'received': return 'bg-green-900/30 text-green-300';
      default: return 'bg-navy-700 text-gray-400';
    }
  };

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <HeartHandshake className="text-pink-500" /> Support Requirements
        </h1>
        <p className="text-gray-400 mt-2">AI-identified needs based on your project description and current stage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requirements.items.map((req, idx) => (
          <Card key={idx} className="bg-navy-800 border-navy-700 flex flex-col h-full p-0 overflow-hidden">
            <div className="p-5 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-navy-900 rounded-lg inline-block border border-navy-700">
                  {getIconForType(req.type)}
                </div>
                <Badge className={`border ${getPriorityColor(req.priority)}`}>
                  {req.priority || 'Medium'} Priority
                </Badge>
              </div>
              
              <h3 className="text-xl font-bold mb-2 capitalize">{req.type} Support</h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                {req.reasoning || req.description}
              </p>
              
              {req.specificNeeds && req.specificNeeds.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Specific Needs</span>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 ml-1">
                    {req.specificNeeds.map((need, i) => (
                      <li key={i}>{need}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 border-t border-navy-700 bg-navy-900/50 flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase font-medium">Status</span>
              <Badge className={getStatusColor(req.status || 'Looking for Support')}>
                {req.status || 'Looking for Support'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
