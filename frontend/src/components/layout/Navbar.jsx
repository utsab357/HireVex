import React from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  
  // Extract initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return 'HR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-[72px] px-8 flex items-center justify-between flex-shrink-0 border-b border-[rgba(73,69,79,0.15)] bg-surface">
      {/* Breadcrumbs or Page Title could go here. For now, empty or dynamic */}
      <div className="flex-1"></div>

      {/* Global Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search talent, jobs, or insights..." 
            className="search-bar border-none text-sm placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Icons */}
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <Bell size={20} />
        </button>
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <Sparkles size={20} />
        </button>

        {/* Profile Dropdown (simplified) */}
        <div className="flex items-center gap-3 pl-4 border-l border-[rgba(73,69,79,0.15)]">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-on-surface">{user?.full_name || 'User'}</span>
            <button onClick={logout} className="text-[10px] text-primary hover:underline uppercase tracking-wider">Logout</button>
          </div>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="avatar avatar-sm" />
          ) : (
            <div className="avatar avatar-sm avatar-initials rounded-full">{getInitials(user?.full_name)}</div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
