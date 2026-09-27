import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Save, X, Calendar, FolderOpen, Building, BookOpen, Tag, Edit3, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getStudentProfile, updateStudentProfile } from '@/services/auth';
import { getStudentProjects } from '@/services/projects';
import { DOMAINS } from '@/utils/constants';
import { formatDate } from '@/utils/helpers';

export default function StudentProfile() {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [projectCount, setProjectCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    department: '',
    domain: '',
    skills: []
  });

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      try {
        setLoading(true);
        setError('');
        
        // Fetch real student document from Firestore
        const studentDoc = await getStudentProfile(currentUser.uid);
        const projects = await getStudentProjects(currentUser.uid).catch(() => []);
        setProjectCount(projects.length || 0);

        const mergedData = {
          name: studentDoc?.name || studentDoc?.displayName || userProfile?.displayName || currentUser?.displayName || '',
          institution: studentDoc?.institution || userProfile?.institution || '',
          department: studentDoc?.department || userProfile?.department || '',
          domain: studentDoc?.domain || userProfile?.domain || DOMAINS[0] || 'Software',
          skills: studentDoc?.skills || userProfile?.skills || []
        };

        setFormData(mergedData);
      } catch (err) {
        console.error("Error loading student profile:", err);
        setError("Unable to load profile data from network. Using cached account details.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [currentUser, userProfile]);

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      if (!formData.skills.includes(newSkill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
      }
      e.target.value = '';
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const updateData = {
        name: formData.name,
        displayName: formData.name,
        institution: formData.institution,
        department: formData.department,
        domain: formData.domain,
        skills: formData.skills
      };

      await updateStudentProfile(currentUser.uid, updateData);
      
      setSuccess('Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading student profile..." />;
  }

  const displayName = formData.name || 'Not provided';
  const institution = formData.institution || 'Not provided';
  const department = formData.department || 'Not provided';
  const domain = formData.domain || 'Not provided';
  const skillsList = formData.skills && formData.skills.length > 0 ? formData.skills : [];

  return (
    <div className="p-6 bg-navy-900 min-h-screen text-white max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="w-8 h-8 text-blue-500" />
            Student Profile
          </h1>
          <p className="text-gray-400 text-sm">Manage your academic credentials, primary domain, and technical skills.</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? 'secondary' : 'primary'}
          className="flex items-center gap-2 shrink-0"
        >
          {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {success && (
        <div className="bg-emerald-900/30 text-emerald-400 p-4 rounded-xl border border-emerald-500/50 flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-900/30 text-red-400 p-4 rounded-xl border border-red-500/50 flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-navy-800 border-navy-700 text-center p-6">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-navy-900 shadow-xl text-white">
              {getInitials(formData.name)}
            </div>
            <h2 className="text-xl font-bold text-white">{displayName}</h2>
            <p className="text-blue-400 text-sm font-semibold mb-4">{domain}</p>
            <Badge className="bg-blue-900/60 text-blue-300 w-full justify-center py-1.5 font-bold">
              ROLE: STUDENT INNOVATOR
            </Badge>
          </Card>

          <Card className="bg-navy-800 border-navy-700 p-5 space-y-4">
            <h3 className="font-semibold text-gray-300 text-xs uppercase tracking-wider border-b border-white/10 pb-2">Account Overview</h3>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="truncate">{currentUser?.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <FolderOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Projects Uploaded: <strong className="text-white font-bold">{projectCount}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Member Since: {formatDate(userProfile?.created_at || currentUser?.metadata?.creationTime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Identity Verified</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Detail Display / Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-navy-800 border-navy-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
              <BookOpen className="w-5 h-5 text-blue-400" />
              Academic & Technical Details
            </h3>

            {!isEditing ? (
              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase mb-1">Full Name</label>
                    <div className="text-white bg-navy-900 p-3 rounded-lg border border-white/10 font-medium">
                      {displayName}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase mb-1">Email Address</label>
                    <div className="text-white bg-navy-900 p-3 rounded-lg border border-white/10 font-medium">
                      {currentUser?.email || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase mb-1">Institution / College</label>
                    <div className="text-white bg-navy-900 p-3 rounded-lg border border-white/10 font-medium flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-400" />
                      <span>{institution}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase mb-1">Department</label>
                    <div className="text-white bg-navy-900 p-3 rounded-lg border border-white/10 font-medium">
                      {department}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block font-semibold uppercase mb-1">Primary Domain</label>
                  <div className="text-white bg-navy-900 p-3 rounded-lg border border-white/10 font-medium">
                    <Badge className="bg-blue-900/60 text-blue-300 font-bold">{domain}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 block font-semibold uppercase mb-2">Skills & Technologies</label>
                  {skillsList.length === 0 ? (
                    <div className="text-gray-400 italic bg-navy-900 p-3 rounded-lg border border-white/10 text-xs">
                      Not provided
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 p-3 bg-navy-900 border border-white/10 rounded-lg">
                      {skillsList.map((skill, idx) => (
                        <Badge key={idx} className="bg-blue-900/50 text-blue-300 border border-blue-500/30 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Akash S T"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Institution / University"
                    name="institution"
                    value={formData.institution}
                    onChange={handleInputChange}
                    placeholder="e.g. SRI / MIT"
                  />
                  <Input
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. ECE / Computer Science"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Primary Domain</label>
                  <select
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    className="w-full bg-navy-900 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    {DOMAINS.map(d => {
                      const val = typeof d === 'object' ? (d.value || d.id || d.label) : d;
                      const label = typeof d === 'object' ? (d.label || d.value) : d;
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Skills & Expertise</label>
                  <div className="flex flex-wrap gap-2 mb-2 p-3 bg-navy-900 border border-white/10 rounded-lg min-h-[46px]">
                    {formData.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-blue-900/60 text-blue-300 flex items-center gap-1">
                        {skill}
                        <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleSkillRemove(skill)} />
                      </Badge>
                    ))}
                    <input
                      type="text"
                      className="bg-transparent border-none outline-none text-sm text-white flex-grow min-w-[120px]"
                      placeholder="Type a skill and press Enter..."
                      onKeyDown={handleSkillAdd}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Press Enter after typing a skill to add it.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
