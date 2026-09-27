import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Eye, EyeOff, AlertCircle, Sparkles, User, Brain } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, registerStudent, registerMentor } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const res = await login(email, password);
      const role = res.role || res.profile?.role;

      if (role === 'student') {
        navigate('/student/dashboard');
      } else if (role === 'mentor' || role === 'investor' || role === 'industrialist') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Account not found or password incorrect. Please check your details or register a new account below.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to log in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoStudent = async () => {
    try {
      setError('');
      setLoading(true);
      try {
        await registerStudent({
          email: 'student.demo@afterlife.dev',
          password: 'password123',
          name: 'Demo Student',
          institution: 'MIT Innovation Lab',
          department: 'Computer Science',
          domain: 'Artificial Intelligence',
          skills: ['React', 'Python', 'TensorFlow', 'Node.js']
        });
      } catch (regErr) {
        await login('student.demo@afterlife.dev', 'password123');
      }
      navigate('/student/dashboard');
    } catch (err) {
      console.error("Demo student error:", err);
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoMentor = async () => {
    try {
      setError('');
      setLoading(true);
      try {
        await registerMentor({
          email: 'mentor.demo@afterlife.dev',
          password: 'password123',
          name: 'Dr. Sarah Chen',
          role: 'mentor',
          organization: 'DeepTech Ventures',
          domains: ['Artificial Intelligence', 'Healthcare / MedTech'],
          areasOfInterest: 'AI, MedTech, Robotics',
          skills: ['System Design', 'AI Architecture', 'Product Strategy'],
          supportTypes: ['Technical Mentorship', 'Funding', 'Industry Validation'],
          bio: 'Senior AI Researcher & Venture Mentor.'
        });
      } catch (regErr) {
        await login('mentor.demo@afterlife.dev', 'password123');
      }
      navigate('/mentor/dashboard');
    } catch (err) {
      console.error("Demo mentor error:", err);
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex text-white relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center text-gray-400 hover:text-white transition-colors z-20">
        <Zap className="h-6 w-6 text-blue-500 mr-2" />
        <span className="font-bold text-xl tracking-tight">Project Afterlife</span>
      </Link>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10 pt-20 lg:pt-8">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-gray-400">Log in to continue building the future.</p>
          </div>

          {/* Quick Demo Login Box */}
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-center text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4 mr-1.5" /> Quick Demo Testing
            </div>
            <p className="text-xs text-gray-300 mb-3">Instant 1-click test login for immediate portal access:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDemoStudent}
                disabled={loading}
                className="py-2 px-3 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 rounded-lg text-xs font-semibold text-blue-300 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <User className="h-3.5 w-3.5 mr-1.5" /> Demo Student
              </button>
              <button
                type="button"
                onClick={handleQuickDemoMentor}
                disabled={loading}
                className="py-2 px-3 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-lg text-xs font-semibold text-purple-300 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Brain className="h-3.5 w-3.5 mr-1.5" /> Demo Mentor
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-200">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input 
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-navy-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-navy-800 border border-navy-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-navy-900 disabled:opacity-50 transition-all shadow-lg"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-navy-800 text-center">
            <p className="text-gray-400 mb-4">Don't have an account?</p>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
              <Link to="/register/student" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Register as Student
              </Link>
              <span className="hidden sm:inline text-gray-600">•</span>
              <Link to="/register/mentor" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                Register as Mentor/Investor
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy-800 to-navy-900 items-center justify-center p-12 border-l border-navy-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl animate-blob" style={{ animationDelay: '4s' }}></div>
        </div>
        
        <div className="z-10 text-center max-w-lg">
          <Zap className="h-24 w-24 text-blue-500 mx-auto mb-8" />
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
            Resurrect Dead Projects
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Join the ecosystem where abandoned student projects find new life, mentorship, and investment to become real-world solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
