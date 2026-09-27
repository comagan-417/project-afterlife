import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DOMAINS } from '@/utils/constants';
import { Zap, User, Mail, Lock, Building, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    department: '',
    domain: '',
    skills: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        return setError('All fields are required.');
      }
      if (formData.password.length < 8) {
        return setError('Password must be at least 8 characters long.');
      }
      if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
      }
    }
    if (step === 2) {
      if (!formData.institution || !formData.department || !formData.domain || !formData.skills) {
        return setError('All fields are required.');
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
      
      await registerStudent({
        email: formData.email, 
        password: formData.password, 
        displayName: formData.name,
        name: formData.name,
        institution: formData.institution,
        department: formData.department,
        domain: formData.domain,
        skills: skillsArray
      });
      
      navigate('/student/dashboard');
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

  return (
    <div className="min-h-screen bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors">
        <Zap className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-bold text-xl tracking-tight">Project Afterlife</span>
      </Link>
      
      <div className="w-full max-w-2xl mt-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Join as a Student</h1>
          <p className="text-gray-400">Bring your abandoned projects back to life</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                  step >= i ? 'bg-blue-600 text-white' : 'bg-navy-800 text-gray-500 border border-navy-700'
                }`}>
                  {step > i ? <CheckCircle className="h-5 w-5" /> : i}
                </div>
                {i < 3 && (
                  <div className={`h-1 w-16 sm:w-24 rounded-full transition-colors ${
                    step > i ? 'bg-blue-600' : 'bg-navy-800'
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
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-4 border-b border-navy-700 pb-2">Account Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                      placeholder="John Doe" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                      placeholder="john@example.com" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input type="password" name="password" value={formData.password} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                        placeholder="Min. 8 characters" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                        placeholder="Repeat password" required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-4 border-b border-navy-700 pb-2">Academic Profile</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Institution / University</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-500" />
                    </div>
                    <input type="text" name="institution" value={formData.institution} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                      placeholder="e.g. MIT" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                    placeholder="e.g. Computer Science" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Primary Domain</label>
                  <select name="domain" value={formData.domain} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white" required>
                    <option value="" disabled>Select a domain</option>
                    {DOMAINS.map(d => {
                      const val = typeof d === 'object' ? (d.value || d.id || d.label) : d;
                      const label = typeof d === 'object' ? (d.label || d.value) : d;
                      return (
                        <option key={val} value={val}>{label}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Skills (comma-separated)</label>
                  <input type="text" name="skills" value={formData.skills} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-navy-900 border border-navy-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors text-white"
                    placeholder="e.g. React, Node.js, Python" required />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-semibold mb-4 border-b border-navy-700 pb-2">Review & Submit</h2>
                
                <div className="bg-navy-900 p-5 rounded-lg border border-navy-700">
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Account</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{formData.email}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3 pt-4 border-t border-navy-700">Academic</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Institution</p>
                      <p className="font-medium">{formData.institution}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{formData.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Domain</p>
                      <p className="font-medium">{formData.domain}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.split(',').map((skill, i) => skill.trim() && (
                          <span key={i} className="px-2 py-1 bg-navy-700 text-xs rounded-md text-gray-300 border border-navy-600">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 text-center">
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
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center ml-auto shadow-lg shadow-blue-900/20">
                  Next Step <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button type="submit" disabled={loading}
                  className="px-8 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 transition-all shadow-lg ml-auto flex items-center">
                  {loading ? 'Registering...' : 'Complete Registration'} <CheckCircle className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </form>
        </div>
        
        <p className="text-center mt-6 text-gray-400">
          Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Log In</Link>
        </p>
      </div>
    </div>
  );
}
