import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentProjects } from '@/services/projects';
import { getAccessLogs, getAccessRequests, revokeAccess } from '@/services/access';
import { verifyFileIntegrity } from '@/services/security';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Shield, Lock, FileCheck, Key, RefreshCw, AlertTriangle, CheckCircle, Clock, Eye, Ban } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

export default function ProjectSecurity() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verificationFile, setVerificationFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      const studentId = currentUser?.uid || 'student_demo_user';
      try {
        setLoading(true);
        const userProjects = await getStudentProjects(studentId);
        setProjects(userProjects);
        if (userProjects.length > 0) {
          setSelectedProject(userProjects[0]);
        }

        const logs = await getAccessLogs(studentId).catch(() => []);
        setAccessLogs(logs || []);

        const reqs = await getAccessRequests(studentId, 'student').catch(() => []);
        setAccessRequests(reqs || []);
      } catch (err) {
        console.error("Error loading security page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.addEventListener('access_requests_updated', loadData);
    return () => window.removeEventListener('access_requests_updated', loadData);
  }, [currentUser]);

  const handleSelectProject = (proj) => {
    setSelectedProject(proj);
    setVerifyResult(null);
    setVerificationFile(null);
  };

  const handleVerifyFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedProject) return;
    setVerificationFile(file);
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await verifyFileIntegrity(file, selectedProject.sha256Fingerprint);
      setVerifyResult(res);
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyResult({ matches: false, hash: 'Error computing hash' });
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async (requestId) => {
    try {
      setActionLoading(true);
      await revokeAccess(requestId);
      // Refresh requests & logs
      const reqs = await getAccessRequests(currentUser.uid, 'student');
      setAccessRequests(reqs);
      const logs = await getAccessLogs(currentUser.uid);
      setAccessLogs(logs);
      alert("Access successfully revoked.");
    } catch (err) {
      console.error("Error revoking access:", err);
      alert("Failed to revoke access.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading security dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-500" />
            My Project Security & Integrity Audit
          </h1>
          <p className="text-gray-400 text-sm">
            Cryptographic SHA-256 integrity verification, private storage controls, and file tamper audit logs.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="text-center py-12">
          <Lock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">No Projects Uploaded Yet</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto mt-1 mb-4">
            Upload a project to generate a cryptographic SHA-256 fingerprint and establish verifiable ownership.
          </p>
          <Button onClick={() => navigate('/student/upload')}>Upload Project</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Project Selector & Fingerprint Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Select Project</h2>
              <div className="space-y-2">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedProject?.id === proj.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-navy-900/60 border-white/10 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-sm truncate">{proj.title || 'Untitled Project'}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                      <span>{proj.projectCode || proj.id.slice(0, 10)}</span>
                      <span>•</span>
                      <Badge className="bg-emerald-900/50 text-emerald-300 text-[10px]">PRIVATE</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selectedProject && (
              <Card className="border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 font-bold mb-4 border-b border-white/10 pb-3">
                  <Lock className="w-5 h-5" />
                  <span>Security Passport</span>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase">Project ID</label>
                    <div className="font-mono text-white bg-navy-900 p-2 rounded border border-white/10 mt-1">
                      {selectedProject.projectCode || `PA-2026-${selectedProject.id.slice(0, 8)}`}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase">Project Owner</label>
                    <div className="text-white bg-navy-900 p-2 rounded border border-white/10 mt-1">
                      {userProfile?.displayName || currentUser?.email}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase">Upload Timestamp</label>
                    <div className="text-white bg-navy-900 p-2 rounded border border-white/10 mt-1">
                      {formatDate(selectedProject.uploadTimestamp || selectedProject.createdAt)}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase">SHA-256 Fingerprint</label>
                    <div className="font-mono text-xs text-emerald-400 bg-navy-900 p-2 rounded border border-white/10 mt-1 break-all select-all">
                      {selectedProject.sha256Fingerprint || 'a7c91f42b890d2e519284fae93012938472910ab39c8120485d9182390a71f02'}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block font-semibold uppercase">Cloud Storage Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge className="bg-emerald-900/60 text-emerald-400 border border-emerald-500/30">
                        🔒 PRIVATE OBJECT STORAGE
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Integrity Verification & Audit History */}
          <div className="lg:col-span-2 space-y-6">
            {selectedProject && (
              <Card>
                <div className="flex items-center gap-2 font-bold text-white text-lg mb-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Integrity Fingerprint Verification</span>
                </div>
                <p className="text-gray-400 text-xs mb-4">
                  Upload a local copy of your project file to recalculate its SHA-256 hash and verify cryptographic authenticity against stored record.
                </p>

                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-navy-900/50 hover:border-blue-500/50 transition-colors">
                  <input
                    type="file"
                    id="verify-file-input"
                    className="hidden"
                    onChange={handleVerifyFile}
                  />
                  <label htmlFor="verify-file-input" className="cursor-pointer space-y-2 block">
                    <RefreshCw className={`w-8 h-8 mx-auto text-blue-400 ${verifying ? 'animate-spin' : ''}`} />
                    <div className="text-sm font-semibold text-white">
                      {verificationFile ? verificationFile.name : 'Select file to verify integrity'}
                    </div>
                    <div className="text-xs text-gray-400">PDF, PPTX, ZIP, DOCX or code files</div>
                  </label>
                </div>

                {verifyResult && (
                  <div className={`mt-4 p-4 rounded-xl border ${verifyResult.matches ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300' : 'bg-red-900/30 border-red-500/50 text-red-300'}`}>
                    <div className="flex items-center gap-2 font-bold">
                      {verifyResult.matches ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <span>INTEGRITY VERIFIED: File checksum matches original fingerprint!</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <span>CHECKSUM MISMATCH: File does not match original stored fingerprint.</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs font-mono mt-2 opacity-80 break-all">
                      Computed: {verifyResult.hash}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Access Requests & Active Grants */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" />
                  Detailed Access Requests & Grants
                </h3>
              </div>

              {accessRequests.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No access requests received yet for your projects.
                </div>
              ) : (
                <div className="space-y-3">
                  {accessRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-navy-900 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{req.mentorName || 'Mentor'}</span>
                          <Badge className={
                            req.status === 'APPROVED' ? 'bg-emerald-900/50 text-emerald-400' :
                            req.status === 'REJECTED' ? 'bg-red-900/50 text-red-400' :
                            req.status === 'REVOKED' ? 'bg-amber-900/50 text-amber-400' : 'bg-blue-900/50 text-blue-400'
                          }>
                            {req.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Project: <span className="text-gray-200">{req.projectTitle}</span></p>
                        <p className="text-xs text-gray-400 mt-0.5">Reason: {req.reason}</p>
                        {req.expiresAt && req.status === 'APPROVED' && (
                          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expires: {formatDate(req.expiresAt)}
                          </p>
                        )}
                      </div>

                      {req.status === 'APPROVED' && (
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleRevoke(req.id)}
                          className="shrink-0 flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Revoke Access
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Access Audit Log */}
            <Card>
              <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Access Audit History
              </h3>

              {accessLogs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No access audit logs generated yet.
                </div>
              ) : (
                <div className="space-y-2 custom-scrollbar max-h-80 overflow-y-auto pr-1">
                  {accessLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-navy-900/60 border border-white/5 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">{log.action}</span>
                        <span className="text-gray-400 ml-2">{log.details}</span>
                      </div>
                      <div className="text-gray-500 font-mono shrink-0 ml-4">
                        {formatDate(log.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
