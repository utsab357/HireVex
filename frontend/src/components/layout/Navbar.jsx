import React from 'react';
import { Search, Bell, Sparkles, Menu } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  
  // Extract initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return 'HR';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-[72px] px-4 md:px-8 flex items-center justify-between flex-shrink-0 border-b border-[rgba(73,69,79,0.15)] bg-surface relative z-10 w-full overflow-hidden">
      
      <div className="flex items-center gap-4">
        <button 
          className="md:hidden text-on-surface-variant hover:text-on-surface transition-colors"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Search talent, jobs, or insights..." 
            className="bg-surface-container-low text-on-surface border border-transparent rounded-full py-[10px] pl-[42px] pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary w-[340px] transition-all"
          />
        </div>
        
        {/* Mobile Search Icon */}
        <button className="md:hidden text-on-surface-variant hover:text-primary transition-colors">
          <Search size={20} />
        </button>

        {/* Icons */}
        <button className="text-on-surface-variant hover:text-primary transition-colors hidden sm:block">
          <Sparkles size={20} />
        </button>

        {/* Profile Dropdown (simplified) */}
        <div className="flex items-center gap-3 pl-2 md:pl-4 md:border-l border-[rgba(73,69,79,0.15)] cursor-pointer hover:opacity-80 transition-opacity">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-on-surface leading-tight">{user?.full_name || 'User'}</span>
            <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-[10px] text-primary hover:underline uppercase tracking-wider leading-tight mt-0.5">Logout</button>
          </div>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className="avatar avatar-sm border border-primary/20" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-primary text-on-primary flex items-center justify-center text-xs font-bold shadow-sm">
               {getInitials(user?.full_name)}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
