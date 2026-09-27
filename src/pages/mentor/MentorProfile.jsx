import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Save, Briefcase, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingSpinner, Card, Button, Input } from '@/components/ui';
import { updateMentorProfile } from '@/services/auth';
import { DOMAINS, SUPPORT_TYPES } from '@/utils/constants.js';

export default function MentorProfile() {
  const { currentUser, userProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    organization: '',
    mentorRole: 'mentor',
    bio: '',
    experienceLevel: 'practitioner',
    domains: [],
    skills: [],
    supportTypesOffered: []
  });

  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (userProfile) {
      const nameParts = (userProfile.displayName || '').split(' ');
      setFormData({
        firstName: userProfile.firstName || nameParts[0] || 'Mentor',
        lastName: userProfile.lastName || nameParts.slice(1).join(' ') || 'User',
        organization: userProfile.organization || '',
        mentorRole: userProfile.mentorRole || userProfile.role || 'mentor',
        bio: userProfile.bio || '',
        experienceLevel: userProfile.experienceLevel || 'practitioner',
        domains: Array.isArray(userProfile.domains) ? userProfile.domains : (userProfile.domain ? [userProfile.domain] : []),
        skills: Array.isArray(userProfile.skills) ? userProfile.skills : (Array.isArray(userProfile.technologies) ? userProfile.technologies : []),
        supportTypesOffered: Array.isArray(userProfile.supportTypesOffered) ? userProfile.supportTypesOffered : []
      });
    } else {
      setFormData(prev => ({
        ...prev,
        firstName: 'Mentor',
        lastName: 'User'
      }));
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDomainToggle = (domainVal) => {
    setFormData(prev => {
      const currentDomains = Array.isArray(prev.domains) ? prev.domains : [];
      const domains = currentDomains.includes(domainVal)
        ? currentDomains.filter(d => d !== domainVal)
        : [...currentDomains, domainVal];
      return { ...prev, domains };
    });
  };

  const handleSupportTypeToggle = (typeVal) => {
    setFormData(prev => {
      const currentTypes = Array.isArray(prev.supportTypesOffered) ? prev.supportTypesOffered : [];
      const types = currentTypes.includes(typeVal)
        ? currentTypes.filter(t => t !== typeVal)
        : [...currentTypes, typeVal];
      return { ...prev, supportTypesOffered: types };
    });
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      const currentSkills = Array.isArray(formData.skills) ? formData.skills : [];
      if (!currentSkills.includes(skillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...currentSkills, skillInput.trim()] }));
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: (Array.isArray(prev.skills) ? prev.skills : []).filter(s => s !== skill) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const effectiveUid = currentUser?.uid || 'mentor_demo_user';
      await updateMentorProfile(effectiveUid, formData);

      // Instantly update local session storage
      try {
        const savedSession = localStorage.getItem('pa_user_session');
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const updatedProfile = {
            ...parsed.profile,
            ...formData,
            displayName: fullName
          };
          localStorage.setItem('pa_user_session', JSON.stringify({ user: parsed.user, profile: updatedProfile }));
        }
      } catch (e) {}

      setSuccessMsg('Profile updated successfully! AI candidate recommendations will reflect your updated expertise.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setErrorMsg('Failed to sync profile online, but changes have been saved locally.');
    } finally {
      setLoading(false);
    }
  };

  const getOptionValue = (item) => typeof item === 'string' ? item : (item?.value || item?.id || String(item));
  const getOptionLabel = (item) => typeof item === 'string' ? item : (item?.label || item?.value || String(item));

  return (
    <div className="min-h-screen bg-navy-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="w-8 h-8 text-purple-400" /> Mentor Profile
          </h1>
          <p className="text-gray-400 mt-1">Your profile is used by the AI matching engine to find relevant projects.</p>
        </div>

        {successMsg && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-400 p-4 rounded-md flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-4 rounded-md flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <Card className="bg-navy-800 border-navy-700 p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-navy-700 pb-2">
              <Briefcase className="w-5 h-5 text-purple-400" /> Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
              
              <Input label="Organization / Company" name="organization" value={formData.organization} onChange={handleChange} placeholder="e.g. Acme Tech, Independent Consultant" />
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Account Role (Read-only)</label>
                <div className="bg-navy-900/50 border border-navy-700 rounded-md px-3 py-2 text-gray-400 capitalize">
                  {typeof formData.mentorRole === 'string' ? formData.mentorRole : 'Mentor'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Professional Bio & Project Focus</label>
              <textarea 
                name="bio"
                className="w-full bg-navy-900 border border-navy-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Briefly describe your background and the kind of projects you are interested in supporting..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Experience Level</label>
              <div className="flex flex-wrap gap-4">
                {['practitioner', 'senior', 'expert', 'executive'].map(level => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="experienceLevel" 
                      value={level} 
                      checked={formData.experienceLevel === level} 
                      onChange={handleChange}
                      className="text-purple-600 focus:ring-purple-500 bg-navy-900 border-navy-600"
                    />
                    <span className="capitalize text-gray-300">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          <Card className="bg-navy-800 border-navy-700 p-6 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2 border-b border-navy-700 pb-2">
              <Tag className="w-5 h-5 text-purple-400" /> Expertise & Interests
            </h2>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Domain Specializations (Select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {DOMAINS.map(domain => {
                  const val = getOptionValue(domain);
                  const lbl = getOptionLabel(domain);
                  const isSelected = Array.isArray(formData.domains) && formData.domains.includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleDomainToggle(val)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        isSelected
                          ? 'bg-purple-900/50 border-purple-500 text-purple-300 font-semibold'
                          : 'bg-navy-900 border-navy-700 text-gray-400 hover:border-navy-500'
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Specific Skills (Type and press Enter to add)</label>
              <div className="bg-navy-900 border border-navy-700 rounded-md p-2 flex flex-wrap gap-2 items-center focus-within:border-purple-500">
                {Array.isArray(formData.skills) && formData.skills.map(skill => (
                  <span key={skill} className="bg-navy-700 text-gray-200 px-2 py-1 rounded text-sm flex items-center gap-1">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-gray-400 hover:text-white ml-1">&times;</button>
                  </span>
                ))}
                <input 
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="e.g. React, MLOps, B2B Sales..."
                  className="bg-transparent border-none outline-none flex-1 min-w-[150px] text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3 text-gray-300">How can you help? (Support Types Offered)</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUPPORT_TYPES.map(type => {
                  const val = getOptionValue(type);
                  const lbl = getOptionLabel(type);
                  const isChecked = Array.isArray(formData.supportTypesOffered) && formData.supportTypesOffered.includes(val);
                  return (
                    <label key={val} className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                      isChecked ? 'bg-purple-900/20 border-purple-500/50' : 'bg-navy-900 border-navy-700 hover:border-navy-600'
                    }`}>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSupportTypeToggle(val)}
                        className="mt-1 text-purple-600 focus:ring-purple-500 bg-navy-800 border-navy-600 rounded"
                      />
                      <div>
                        <div className={`font-medium ${isChecked ? 'text-purple-300' : 'text-gray-300'}`}>
                          {lbl}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              className="bg-purple-600 hover:bg-purple-700 px-8 py-2 text-white font-semibold flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
