import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Auth components
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Shared components
import Navbar from './components/Shared/Navbar';

// Dashboard components
import HODDashboard from './components/HOD/HODDashboard';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentDashboard from './components/Student/StudentDashboard';

// HOD components
import TemplateList from './components/HOD/TemplateList';
import HODClassroomList from './components/HOD/HODClassroomList';
import CourseList from './components/HOD/CourseList';
import CourseDetail from './components/HOD/CourseDetail';

// Teacher components
import ClassroomList from './components/Teacher/ClassroomList';
import CreateClassroom from './components/Teacher/CreateClassroom';
import ClassroomDetail from './components/Teacher/ClassroomDetail';
import CreateExperiment from './components/Teacher/CreateExperiment';
import ExperimentSubmissions from './components/Teacher/ExperimentSubmissions';
import EditExperiment from './components/Teacher/EditExperiment';
import SubmissionReview from './components/Teacher/SubmissionReview';

// Student components
import StudentClassroomList from './components/Student/StudentClassroomList';
import StudentSubmissions from './components/Student/StudentSubmissions';
import StudentClassroomDetail from './components/Student/StudentClassroomDetail';

// Lazy load heavy PDF components
const UploadArea = React.lazy(() => import('./components/Teacher/UploadArea'));
const TemplateEditor = React.lazy(() => import('./components/Teacher/TemplateEditor'));
const FormFiller = React.lazy(() => import('./components/Student/FormFiller'));

const LoadingFallback = () => (
  <div className="flex justify-center p-10">
    <Loader2 className="animate-spin text-accent w-8 h-8" />
  </div>
);

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to appropriate dashboard based on role
  switch (user.role) {
    case 'HOD':
      return <Navigate to="/hod/dashboard" replace />;
    case 'Teacher':
      return <Navigate to="/teacher/dashboard" replace />;
    case 'Student':
      return <Navigate to="/student/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function AppContent() {
  return (
    <div className="min-h-screen bg-subtle-gray">
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* HOD routes */}
          <Route
            path="/hod/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/templates/new"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <UploadArea />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/templates/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <TemplateEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/classrooms"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <HODClassroomList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/templates"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <TemplateList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/courses"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <CourseList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod/courses/:id"
            element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <CourseDetail />
              </ProtectedRoute>
            }
          />

          {/* Teacher routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classrooms"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <ClassroomList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classrooms/new"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <CreateClassroom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classrooms/:id"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <ClassroomDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classrooms/:id/assignments/new"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <CreateExperiment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/experiments/:id/submissions"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <ExperimentSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/submissions/:id/review"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <SubmissionReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/experiments/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <EditExperiment />
              </ProtectedRoute>
            }
          />

          {/* Student routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classrooms"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentClassroomList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classrooms/:id"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentClassroomDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/submissions"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentSubmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignment/:assignmentId/fill"
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <FormFiller />
              </ProtectedRoute>
            }
          />

          {/* Legacy routes for backward compatibility */}
          <Route path="/editor/:id" element={<Navigate to="/hod/templates/:id/edit" replace />} />
          <Route path="/form/:id" element={<Navigate to="/student/assignment/:id/fill" replace />} />

          {/* Unauthorized page */}
          <Route
            path="/unauthorized"
            element={
              <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-serif font-bold text-ink">Access Denied</h1>
                  <p className="text-ink-light">You don't have permission to access this page.</p>
                </div>
              </div>
            }
          />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <div className="flex h-screen items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-serif font-bold text-ink">404</h1>
                  <p className="text-ink-light">Page not found</p>
                </div>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
