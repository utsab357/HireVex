import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, LayoutDashboard, GitMerge, Settings, LifeBuoy, Sparkles, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { icon: Home, label: 'HOME', path: '/dashboard' },
    { icon: Briefcase, label: 'JOBS', path: '/jobs' },
    { icon: GitMerge, label: 'TALENT FLOW', path: '/pipeline' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[220px] bg-surface-container flex flex-col h-full border-r border-[rgba(73,69,79,0.15)] flex-shrink-0 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="p-6 pb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-1">Hirevex</h1>
            <p className="text-[10px] text-secondary uppercase tracking-[0.1em] font-semibold">Intelligent Co-pilot</p>
          </div>
          <button className="md:hidden text-on-surface-variant hover:text-on-surface" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-surface-container-highest text-primary shadow-[inset_3px_0_0_0_#bdc2ff]' 
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`
              }
            >
              <item.icon size={18} className="flex-shrink-0" />
              <span className="uppercase tracking-[0.05em] text-[12px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 space-y-4">
          <button className="w-full btn-primary flex justify-center items-center">
            Upgrade to Pro
          </button>
          
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <Settings size={18} />
              <span className="uppercase tracking-[0.05em] text-[11px] font-semibold">Settings</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              <LifeBuoy size={18} />
              <span className="uppercase tracking-[0.05em] text-[11px] font-semibold">Support</span>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
