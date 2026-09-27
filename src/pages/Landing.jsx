import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap, ArrowRight, Brain, Target, Users, Shield, TrendingUp,
  GitBranch, Star, CheckCircle, Circle, ChevronRight, Globe,
  Layers, BarChart3, Lock, Activity, Rocket, BookOpen, Building2
} from 'lucide-react'
import { db } from '@/firebase.js'
import { doc, getDoc } from 'firebase/firestore'

// Real stats from backend — never hardcoded
function usePlatformStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    getDoc(doc(db, 'platformStats', 'global'))
      .then(snap => { if (snap.exists()) setStats(snap.data()) })
      .catch(() => setStats(null))
  }, [])
  return stats
}

const LIFECYCLE = [
  'Hackathon', 'Student Project', 'Project Upload', 'AI Understanding',
  'Evidence Extraction', 'AI Assessment', 'Explainable Score', 'Project Profile',
  'AI Matching', 'Discovery', 'Mentor Interest', 'Connection',
  'Mentorship / Funding', 'Further Development', 'Incubation', 'Deployment',
]

const HOW_IT_WORKS = [
  { icon: <BookOpen size={22} />, title: 'Upload Your Project', desc: 'Share your hackathon project with details, files, GitHub, and documentation.' },
  { icon: <Brain size={22} />, title: 'AI Understands It', desc: 'Our AI extracts structured intelligence from your project — domain, technologies, components, and more.' },
  { icon: <Target size={22} />, title: 'Evidence-Based Scoring', desc: 'A deterministic engine scores your project across 12 criteria using real evidence — not arbitrary AI guesses.' },
  { icon: <Users size={22} />, title: 'Intelligent Matching', desc: 'The AI matches your project with relevant mentors, investors, and industry professionals.' },
  { icon: <Rocket size={22} />, title: 'Support & Growth', desc: 'Receive mentorship, funding, validation, and support to take your project beyond the hackathon.' },
]

const SCORING_CRITERIA_PREVIEW = [
  { label: 'Problem Relevance', w: 12 },
  { label: 'Solution Quality', w: 10 },
  { label: 'Innovation / Novelty', w: 10 },
  { label: 'Technical Implementation', w: 15 },
  { label: 'Prototype Completeness', w: 10 },
  { label: 'Feasibility', w: 10 },
  { label: 'Validation / Evidence', w: 10 },
  { label: 'Scalability', w: 6 },
  { label: 'Social Impact', w: 6 },
  { label: 'Industry Potential', w: 5 },
  { label: 'Documentation', w: 3 },
  { label: 'Deployment Readiness', w: 3 },
]

const SUPPORT_TYPES = [
  { icon: <Brain size={18} />, label: 'Technical Mentorship', color: 'text-blue-400' },
  { icon: <BarChart3 size={18} />, label: 'Funding & Investment', color: 'text-green-400' },
  { icon: <Building2 size={18} />, label: 'Industry Validation', color: 'text-purple-400' },
  { icon: <Rocket size={18} />, label: 'Incubation', color: 'text-cyan-400' },
  { icon: <Globe size={18} />, label: 'Deployment & Infrastructure', color: 'text-amber-400' },
  { icon: <Users size={18} />, label: 'Networking', color: 'text-rose-400' },
]

const PRIVACY_POINTS = [
  { icon: <Lock size={18} />, title: 'Student Privacy Protected', desc: 'Students never see individual mentor identities or contact information.' },
  { icon: <Shield size={18} />, title: 'Secure Authentication', desc: 'Role-based access control ensures each portal sees only what it should.' },
  { icon: <Lock size={18} />, title: 'AI Keys Never Exposed', desc: 'All AI processing happens server-side. API keys never reach the frontend.' },
  { icon: <Shield size={18} />, title: 'Controlled Connections', desc: 'Students must accept before any contact details are shared.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const stats = usePlatformStats()

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white font-sans">
      {/* ─── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Project Afterlife</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white text-sm transition-colors px-4 py-2">
              Log In
            </button>
            <button onClick={() => navigate('/register/student')} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-8">
            <Zap size={14} />
            <span>Beyond the Hackathon</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none mb-6">
            <span className="block">Project</span>
            <span className="block" style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Afterlife</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-300 font-light mb-4 leading-relaxed">
            Don't let great student projects end with the hackathon.
          </p>
          <p className="text-base text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            An AI-powered ecosystem that gives promising student innovations a second life by connecting them
            with the right mentors, industries, investors and support opportunities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register/student')}
              className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
            >
              I'm a Student
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/register/mentor')}
              className="group flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all"
            >
              I'm a Mentor / Investor / Industrialist
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Stats (real data only) ───────────────────────────────────────────── */}
      {stats && (stats.totalProjects > 0 || stats.totalMentors > 0) && (
        <section className="pb-16 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.totalProjects > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-blue-400">{stats.totalProjects}</div>
                <div className="text-gray-400 text-sm mt-1">Projects</div>
              </div>
            )}
            {stats.totalMentors > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-purple-400">{stats.totalMentors}</div>
                <div className="text-gray-400 text-sm mt-1">Mentors</div>
              </div>
            )}
            {stats.totalConnections > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-cyan-400">{stats.totalConnections}</div>
                <div className="text-gray-400 text-sm mt-1">Connections</div>
              </div>
            )}
            {stats.totalStudents > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-green-400">{stats.totalStudents}</div>
                <div className="text-gray-400 text-sm mt-1">Students</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── The Problem ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-6">The Problem</h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-10">
            {[
              { pct: '~90%', label: 'of hackathon projects disappear within weeks of the event ending' },
              { pct: '0', label: 'structured pathways exist to connect student innovation with industry support' },
              { pct: '∞', label: 'potential — lost when promising projects end with no follow-up' },
            ].map(({ pct, label }) => (
              <div key={label} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-6">
                <div className="text-4xl font-black text-rose-400 mb-3">{pct}</div>
                <p className="text-gray-400 text-sm leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-400 mt-8 text-lg italic">
            "A hackathon ending should not mean a project ending."
          </p>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">How Project Afterlife Works</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-14">
            A complete ecosystem from hackathon submission to real-world deployment.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ icon, title, desc }, i) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4">
                  {icon}
                </div>
                <div className="text-xs text-gray-500 font-mono mb-2">STEP {String(i + 1).padStart(2, '0')}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI-Powered Analysis ─────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-400 text-sm font-medium mb-6">
                <Brain size={14} />
                <span>AI-Powered Analysis</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6">
                Deep Project Intelligence
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Our AI doesn't just read your project — it understands it. It identifies your domain,
                extracts technologies, detects the development stage, and maps every piece of supporting evidence.
              </p>
              <ul className="space-y-3">
                {['Domain & sub-domain detection', 'Technology extraction with evidence sources', 'Project type identification (Software / Hardware / AI / IoT...)', 'Target user analysis', 'Support requirement mapping', 'Next step recommendations'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <CheckCircle size={16} className="text-green-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 font-mono text-sm">
              <div className="text-gray-500 text-xs mb-4">// AI Extracted Intelligence</div>
              <pre className="text-left overflow-x-auto whitespace-pre text-xs leading-relaxed text-gray-300">{`{
  "domain": "Healthcare / AI",
  "sub_domain": "Medical Imaging",
  "project_type": "AI/ML",
  "technologies": [
    "Python", "TensorFlow",
    "OpenCV", "FastAPI"
  ],
  "development_stage": "Prototype",
  "target_users": [
    "Radiologists",
    "Rural Clinics"
  ],
  "evidence_source": "GitHub README",
  "confidence": "HIGH"
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Evidence-Based Scoring ───────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm font-medium mb-6">
              <Target size={14} />
              <span>Explainable Assessment</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Evidence-Based Scoring</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Not an arbitrary AI number. A deterministic engine scores your project across 12 criteria
              using fixed weights and real evidence. Every point is traceable.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              {SCORING_CRITERIA_PREVIEW.map(({ label, w }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="text-gray-400 text-sm w-48 shrink-0">{label}</div>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                  <div className="text-gray-500 text-xs w-8 text-right">{w}pts</div>
                </div>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-blue-400 mb-1">77.2</div>
                <div className="text-gray-400 text-sm">/ 100 points</div>
                <div className="text-xs text-gray-500 mt-2">Example score breakdown</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3">
                  <div className="text-green-400 font-semibold">84%</div>
                  <div className="text-gray-400 text-xs">Evidence Coverage</div>
                </div>
                <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
                  <div className="text-blue-400 font-semibold">HIGH</div>
                  <div className="text-gray-400 text-xs">Confidence</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 text-center">
                Score calculated by deterministic engine — not by AI directly
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Project Lifecycle ────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">The Complete Project Lifecycle</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-12">
            We track every project from hackathon submission to real-world deployment.
          </p>
          <div className="relative">
            <div className="flex flex-wrap justify-center gap-3">
              {LIFECYCLE.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    i === 0 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    i === LIFECYCLE.length - 1 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                    'bg-white/5 text-gray-400 border-white/10'
                  }`}>{stage}</span>
                  {i < LIFECYCLE.length - 1 && <ChevronRight size={12} className="text-gray-600" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Support types ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Mentor & Industry Support</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-12">
            Connect with professionals who can take your project to the next level.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUPPORT_TYPES.map(({ icon, label, color }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
                <div className={`${color} shrink-0`}>{icon}</div>
                <span className="text-sm font-medium text-gray-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Privacy & Security ───────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Privacy & Security</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Built with privacy-first architecture. Student and mentor identities are protected until they choose to connect.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {PRIVACY_POINTS.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-blue-400 shrink-0 mt-0.5">{icon}</div>
                <div>
                  <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Platform Impact (real data only) ────────────────────────────────── */}
      {stats && stats.totalProjects > 0 && (
        <section className="py-16 px-6 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-10">Platform Impact</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Projects Uploaded', val: stats.totalProjects, color: 'text-blue-400' },
                { label: 'Students Registered', val: stats.totalStudents, color: 'text-purple-400' },
                { label: 'Mentors Available', val: stats.totalMentors, color: 'text-cyan-400' },
                { label: 'Connections Made', val: stats.totalConnections, color: 'text-green-400' },
              ].filter(s => s.val > 0).map(({ label, val, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <div className={`text-3xl font-black ${color}`}>{val}</div>
                  <div className="text-gray-400 text-sm mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            Your Project Deserves a<br />
            <span style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Second Life</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Join Project Afterlife and give your innovation the path it deserves.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register/student')}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-500/20"
            >
              I'm a Student <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/register/mentor')}
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all"
            >
              I'm a Mentor / Investor / Industrialist
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Zap size={16} className="text-blue-400" />
            <span className="text-sm font-medium">Project Afterlife</span>
            <span className="text-gray-600">·</span>
            <span className="text-xs">Beyond the Hackathon</span>
          </div>
          <div className="text-xs text-gray-600">
            Real projects. Real mentors. Real connections.
          </div>
        </div>
      </footer>
    </div>
  )
}
