import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Home from './pages/Home/Home';
import Jobs from './pages/Jobs/Jobs';
import JobDetail from './pages/Jobs/JobDetail';
import CandidateDetail from './pages/Candidates/CandidateDetail';
import Pipeline from './pages/Pipeline/Pipeline';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="/pipeline" element={<Pipeline />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
