import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StudentLayout from '@/components/layout/StudentLayout';
import MentorLayout from '@/components/layout/MentorLayout';

// Lazy-load all pages
const Landing = lazy(() => import('@/pages/Landing'));
const Login = lazy(() => import('@/pages/auth/Login'));
const StudentRegister = lazy(() => import('@/pages/auth/StudentRegister'));
const MentorRegister = lazy(() => import('@/pages/auth/MentorRegister'));

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'));
const MyProjects = lazy(() => import('@/pages/student/MyProjects'));
const UploadProject = lazy(() => import('@/pages/student/UploadProject'));
const AIAnalysis = lazy(() => import('@/pages/student/AIAnalysis'));
const ProjectScore = lazy(() => import('@/pages/student/ProjectScore'));
const ImprovementSuggestions = lazy(() => import('@/pages/student/ImprovementSuggestions'));
const ProjectLifecyclePage = lazy(() => import('@/pages/student/ProjectLifecyclePage'));
const SupportRequirements = lazy(() => import('@/pages/student/SupportRequirements'));
const MentorExpertisePage = lazy(() => import('@/pages/student/MentorExpertisePage'));
const StudentNotifications = lazy(() => import('@/pages/student/StudentNotifications'));
const StudentProfile = lazy(() => import('@/pages/student/StudentProfile'));
const ProjectSecurity = lazy(() => import('@/pages/student/ProjectSecurity'));
const AccessRequests = lazy(() => import('@/pages/student/AccessRequests'));
const EvaluationPage = lazy(() => import('@/pages/student/EvaluationPage'));
const MentorshipRequests = lazy(() => import('@/pages/student/MentorshipRequests'));

// Mentor pages
const MentorDashboard = lazy(() => import('@/pages/mentor/MentorDashboard'));
const ProjectDiscovery = lazy(() => import('@/pages/mentor/ProjectDiscovery'));
const ProjectDetail = lazy(() => import('@/pages/mentor/ProjectDetail'));
const SavedProjects = lazy(() => import('@/pages/mentor/SavedProjects'));
const MentorshipHistory = lazy(() => import('@/pages/mentor/MentorshipHistory'));
const MentorNotifications = lazy(() => import('@/pages/mentor/MentorNotifications'));
const MentorProfile = lazy(() => import('@/pages/mentor/MentorProfile'));
const RecommendedProjects = lazy(() => import('@/pages/mentor/RecommendedProjects'));
const MentorPosts = lazy(() => import('@/pages/mentor/MentorPosts'));
const MentorAccessRequests = lazy(() => import('@/pages/mentor/MentorAccessRequests'));

// Admin page
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner fullScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/student" element={<StudentRegister />} />
            <Route path="/register/mentor" element={<MentorRegister />} />

            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="projects" element={<MyProjects />} />
              <Route path="upload" element={<UploadProject />} />
              <Route path="analysis" element={<AIAnalysis />} />
              <Route path="score" element={<ProjectScore />} />
              <Route path="improvements" element={<ImprovementSuggestions />} />
              <Route path="lifecycle" element={<ProjectLifecyclePage />} />
              <Route path="support" element={<SupportRequirements />} />
              <Route path="mentorships" element={<MentorshipRequests />} />
              <Route path="connections" element={<MentorshipRequests />} />
              <Route path="access-requests" element={<AccessRequests />} />
              <Route path="access-control" element={<AccessRequests />} />
              <Route path="security" element={<ProjectSecurity />} />
              <Route path="evaluation" element={<EvaluationPage />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>

            {/* Mentor Routes */}
            <Route 
              path="/mentor" 
              element={
                <ProtectedRoute allowedRoles={['mentor', 'investor', 'industrialist']}>
                  <MentorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/mentor/dashboard" replace />} />
              <Route path="dashboard" element={<MentorDashboard />} />
              <Route path="discover" element={<ProjectDiscovery />} />
              <Route path="projects" element={<ProjectDiscovery />} />
              <Route path="recommended" element={<RecommendedProjects />} />
              <Route path="project/:projectId" element={<ProjectDetail />} />
              <Route path="saved" element={<SavedProjects />} />
              <Route path="mentorships" element={<MentorshipHistory />} />
              <Route path="posts" element={<MentorPosts />} />
              <Route path="access-requests" element={<MentorAccessRequests />} />
              <Route path="notifications" element={<MentorNotifications />} />
              <Route path="profile" element={<MentorProfile />} />
            </Route>

            {/* Admin Monitoring Route */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
