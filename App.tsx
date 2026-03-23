
import React from 'react';
import { Routes, Route, Navigate, HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMyCourses from './pages/student/StudentMyCourses';
import StudentQuizList from './pages/student/StudentQuizList';
import StudentQuizView from './pages/student/StudentQuizView';
import StudentProgress from './pages/student/StudentProgress';
import StudentTutoring from './pages/student/StudentTutoring';
import StudentMentorship from './pages/student/StudentMentorship';
import MentorDashboard from './pages/mentor/MentorDashboard';
import MentorCourseManagement from './pages/mentor/MentorCourseManagement';
import MentorCourseDetail from './pages/mentor/MentorCourseDetail';
import MentorStudentProgress from './pages/mentor/MentorStudentProgress';
import MentorTutoring from './pages/mentor/MentorTutoring';
import MentorMentorship from './pages/mentor/MentorMentorship';
import TutoringRoom from './pages/common/TutoringRoom';
import CommunityForums from './pages/common/CommunityForums';
import ForumThreadView from './pages/common/ForumThreadView';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminCreateUser from './pages/admin/AdminCreateUser';
import AdminCourseAnalytics from './pages/admin/AdminCourseAnalytics';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminContentModeration from './pages/admin/AdminContentModeration';
import AdminSecurity from './pages/admin/AdminSecurity';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import MentorAddCourse from './pages/mentor/MentorAddCourse';
import MentorGenerateQuiz from './pages/mentor/MentorGenerateQuiz';
import MentorEditQuiz from './pages/mentor/MentorEditQuiz';
import MentorManualQuiz from './pages/mentor/MentorManualQuiz';
import AdminStudentProgress from './pages/admin/AdminStudentProgress';
import Landing from './pages/Landing';

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <ToastProvider>
                    <HashRouter>
                        <NetworkStatusIndicator />
                        <AppRoutes />
                    </HashRouter>
                </ToastProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

const AppRoutes: React.FC = () => {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* User-specific common routes */}
            <Route path="/profile" element={
                <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
            } />
            <Route path="/room/:sessionId" element={
                <ProtectedRoute><TutoringRoom /></ProtectedRoute>
            } />
            <Route path="/forums" element={
                <ProtectedRoute><Layout><CommunityForums /></Layout></ProtectedRoute>
            } />
            <Route path="/forums/thread/:threadId" element={
                <ProtectedRoute><Layout><ForumThreadView /></Layout></ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student/my-courses" element={
                <ProtectedRoute roles={['student']}><Layout><StudentMyCourses /></Layout></ProtectedRoute>
            } />
            <Route path="/student/quizzes" element={
                <ProtectedRoute roles={['student']}><Layout><StudentQuizList /></Layout></ProtectedRoute>
            } />
            <Route path="/student/quiz/:quizId" element={
                <ProtectedRoute roles={['student']}><Layout><StudentQuizView /></Layout></ProtectedRoute>
            } />
            <Route path="/student/progress" element={
                <ProtectedRoute roles={['student']}><Layout><StudentProgress /></Layout></ProtectedRoute>
            } />
            <Route path="/student/tutoring" element={
                <ProtectedRoute roles={['student']}><Layout><StudentTutoring /></Layout></ProtectedRoute>
            } />
            <Route path="/student/mentorship" element={
                <ProtectedRoute roles={['student']}><Layout><StudentMentorship /></Layout></ProtectedRoute>
            } />
            <Route path="/student" element={
                <ProtectedRoute roles={['student']}><Layout><StudentDashboard /></Layout></ProtectedRoute>
            } />

            {/* Instructor Routes */}
            <Route path="/mentor/courses" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorCourseManagement /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/course/:courseId" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorCourseDetail /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/add-course" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorAddCourse /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/generate-quiz" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorGenerateQuiz /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/manual-quiz/:courseId" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorManualQuiz /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/manual-quiz" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorManualQuiz /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/quiz/:quizId/edit" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorEditQuiz /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/progress" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorStudentProgress /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/tutoring" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorTutoring /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor/mentorship" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorMentorship /></Layout></ProtectedRoute>
            } />
            <Route path="/mentor" element={
                <ProtectedRoute roles={['mentor']}><Layout><MentorDashboard /></Layout></ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/users/create" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminCreateUser /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/users" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminUserManagement /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminCourseAnalytics /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/progress" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminStudentProgress /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminReports /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminSettings /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/moderation" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminContentModeration /></Layout></ProtectedRoute>
            } />
            <Route path="/admin/security" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminSecurity /></Layout></ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>
            } />

            <Route path="*" element={
                user ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
            } />
        </Routes>
    );
}

export default App;
