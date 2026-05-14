import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import { ToastProvider } from './store/ToastContext';
import AppLayout from './components/layout/AppLayout';

import { lazy, Suspense } from 'react';

// Lazy load Pages
const Landing = lazy(() => import('./pages/Landing/Landing'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const Home = lazy(() => import('./pages/Home/Home'));
const Jobs = lazy(() => import('./pages/Jobs/Jobs'));
const JobDetail = lazy(() => import('./pages/Jobs/JobDetail'));
const CandidateDetail = lazy(() => import('./pages/Candidates/CandidateDetail'));
const Candidates = lazy(() => import('./pages/Candidates/Candidates'));
const TalentFlow = lazy(() => import('./pages/Pipeline/Pipeline'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Compare = lazy(() => import('./pages/Compare/Compare'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Reports = lazy(() => import('./pages/Reports/Reports'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-on-surface-variant font-medium">Loading Hirevex...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/candidates" element={<Candidates />} />
              <Route path="/talent-flow" element={<TalentFlow />} />
              <Route path="/pipeline" element={<Navigate to="/talent-flow" replace />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
