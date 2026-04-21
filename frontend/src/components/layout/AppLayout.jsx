import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../store/AuthContext';

const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-surface text-on-surface">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden w-full relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden w-full max-w-full">
        <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 w-full max-w-[1200px] mx-auto min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
