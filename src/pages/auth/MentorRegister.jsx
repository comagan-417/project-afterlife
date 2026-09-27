import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DOMAINS, SUPPORT_TYPES } from '@/utils/constants';
import { Zap, Brain, TrendingUp, Building2, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function MentorRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    organization: '',
    domains: [],
    areasOfInterest: '',
    skills: '',
    supportTypes: [],
    bio: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerMentor } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
  };

  const handleDomainToggle = (domainId) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domainId)
        ? prev.domains.filter(id => id !== domainId)
        : [...prev.domains, domainId]
    }));
  };

  const handleSupportToggle = (supportId) => {
    setFormData(prev => ({
      ...prev,
      supportTypes: prev.supportTypes.includes(supportId)
        ? prev.supportTypes.filter(id => id !== supportId)
        : [...prev.supportTypes, supportId]
    }));
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
        return setError('All fields and role selection are required.');
      }
      if (formData.password.length < 8) {
        return setError('Password must be at least 8 characters long.');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }
    }
    if (step === 2) {
      if (!formData.organization || formData.domains.length === 0 || !formData.areasOfInterest || !formData.skills || formData.supportTypes.length === 0) {
        return setError('Please fill out all required fields and select at least one domain and support type.');
      }
    }
    if (step === 3) {
      if (!formData.bio) {
        return setError('Please provide a brief bio.');
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return;
    
    try {
      setError('');
      setLoading(true);
      
      const skillsArray = typeof formData.skills === 'string'
        ? formData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
        : formData.skills;
      
      await registerMentor({
        email: formData.email, 
        password: formData.password, 
        displayName: formData.name,
        role: formData.role,
        organization: formData.organization,
        domains: formData.domains,
        areasOfInterest: formData.areasOfInterest,
        skills: skillsArray,
        supportTypes: formData.supportTypes,
        bio: formData.bio
      });
      
      navigate('/mentor/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else {
        setError(err.message || 'Failed to register. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleCards = [
    { id: 'mentor', title: 'Mentor', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/50', desc: 'Technical guidance & architecture review' },
    { id: 'investor', title: 'Investor', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/50', desc: 'Funding & business development' },
    { id: 'industrialist', title: 'Industrialist', icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50', desc: 'Industry validation & deployment' }
  ];

  return (
    <div className="min-h-screen bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors">
        <Zap className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-bold text-xl tracking-tight">Project Afterlife</span>
      </Link>
      
      <div className="w-full max-w-3xl mt-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Join as an Expert</h1>
          <p className="text-gray-400">Guide, fund, or validate the next big innovation</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  step >= i ? 'bg-purple-600 text-white' : 'bg-navy-800 text-gray-500 border border-navy-700'
                }`}>
                  {step > i ? <CheckCircle className="h-5 w-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`h-1 w-16 sm:w-32 rounded-full transition-colors ${
                    step > i ? 'bg-purple-600' : 'bg-navy-800'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-navy-800/50 border border-navy-700 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-2 border-b border-navy-700 pb-2">Account & Role</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Select your role in the ecosystem</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roleCards.map(role => (
                      <div 
                        key={role.id}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                          formData.role === role.id 
                            ? `${role.border} ${role.bg}` 
                            : 'border-navy-700 bg-navy-900 hover:border-navy-600'
                        }`}
                      >
                        <role.icon className={`h-8 w-8 mb-3 ${role.color}`} />
                        <h3 className="font-semibold text-lg mb-1">{role.title}</h3>
                        <p className="text-xs text-gray-400">{role.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="Jane Smith" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="jane@company.com" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="Min. 8 characters" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="Repeat password" required />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-4 border-b border-navy-700 pb-2">Professional Profile</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Organization / Company</label>
                  <input type="text" name="organization" value={formData.organization} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                    placeholder="e.g. Acme Corp / Tech Angels" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Domains of Expertise (Select multiple)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DOMAINS.map(d => {
                      const domainVal = typeof d === 'object' ? (d.value || d.id || d.label) : d;
                      const domainLabel = typeof d === 'object' ? (d.label || d.value) : d;
                      const isSelected = formData.domains.includes(domainVal);
                      return (
                        <button
                          key={domainVal} type="button" onClick={() => handleDomainToggle(domainVal)}
                          className={`text-sm px-3 py-2 rounded-lg border text-left transition-colors ${
                            isSelected 
                              ? 'bg-purple-600/20 border-purple-500 text-white font-medium' 
                              : 'bg-navy-900 border-navy-700 text-gray-400 hover:border-navy-600'
                          }`}
                        >
                          {domainLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Support You Can Offer (Select multiple)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SUPPORT_TYPES.map(s => {
                      const supportVal = typeof s === 'object' ? (s.value || s.id || s.label) : s;
                      const supportLabel = typeof s === 'object' ? (s.label || s.value) : s;
                      const isSelected = formData.supportTypes.includes(supportVal);
                      return (
                        <button
                          key={supportVal} type="button" onClick={() => handleSupportToggle(supportVal)}
                          className={`text-sm px-3 py-2 rounded-lg border text-left transition-colors flex items-center ${
                            isSelected 
                              ? 'bg-green-600/20 border-green-500 text-white font-medium' 
                              : 'bg-navy-900 border-navy-700 text-gray-400 hover:border-navy-600'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${isSelected ? 'bg-green-500' : 'bg-gray-600'}`}></span>
                          {supportLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Specific Areas of Interest</label>
                    <input type="text" name="areasOfInterest" value={formData.areasOfInterest} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="e.g. B2B SaaS, Hardware startups" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Your Core Skills</label>
                    <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors text-white"
                      placeholder="e.g. System Design, Product Strategy (comma separated)" required />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-4 border-b border-navy-700 pb-2">Bio & Review</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Brief Bio & What you look for</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4"
                    className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none text-white"
                    placeholder="Tell us a bit about your background and what kind of projects or founders you want to support..." required />
                </div>

                <div className="bg-navy-900 p-5 rounded-lg border border-navy-700 mt-6">
                  <div className="flex items-center justify-between mb-4 border-b border-navy-700 pb-3">
                    <h3 className="text-gray-400 text-sm uppercase tracking-wider">Profile Summary</h3>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full capitalize">
                      {formData.role}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Organization</p>
                      <p className="font-medium">{formData.organization}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Domains</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.domains.map(val => (
                        <span key={val} className="text-xs text-gray-300 bg-navy-800 px-2 py-1 rounded border border-navy-700">{val}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Support Offering</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.supportTypes.map(val => (
                        <span key={val} className="text-xs text-gray-300 bg-green-900/30 border border-green-800/50 px-2 py-1 rounded">{val}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 text-center mt-4">
                  By clicking submit, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              {step > 1 ? (
                <button type="button" onClick={prevStep}
                  className="px-6 py-2.5 rounded-lg border border-navy-600 text-gray-300 hover:bg-navy-700 hover:text-white transition-colors flex items-center">
                  <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </button>
              ) : (
                <div></div>
              )}
              
              {step < 3 ? (
                <button type="button" onClick={nextStep}
                  className="px-6 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors flex items-center ml-auto shadow-lg shadow-purple-900/20">
                  Next Step <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 transition-all shadow-lg ml-auto flex items-center">
                  {loading ? 'Registering...' : 'Complete Registration'} <CheckCircle className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </form>
        </div>
        
        <p className="text-center mt-6 text-gray-400">
          Already have an account? <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">Log In</Link>
        </p>
      </div>
    </div>
  );
}
