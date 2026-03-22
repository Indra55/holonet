import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Layers, Terminal, Settings, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-screen sticky top-0 py-12 bg-background w-64 border-r border-outline/15 shrink-0">
      <div className="px-8 mb-12">
        <h1 className="text-2xl font-serif text-primary tracking-tighter">Holonet</h1>
        <p className="text-[10px] font-sans uppercase tracking-widest text-secondary mt-1 opacity-50">V1.0.42</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `flex items-center gap-4 py-3 pl-8 transition-colors duration-200 ${isActive ? 'text-primary font-bold border-l-2 border-primary bg-surface/50' : 'text-secondary hover:text-on-surface hover:bg-surface'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-sm font-sans uppercase tracking-widest">Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/services" 
          className={({ isActive }) => `flex items-center gap-4 py-3 pl-8 transition-colors duration-200 ${isActive ? 'text-primary font-bold border-l-2 border-primary bg-surface/50' : 'text-secondary hover:text-on-surface hover:bg-surface'}`}
        >
          <Layers size={20} />
          <span className="text-sm font-sans uppercase tracking-widest">Services</span>
        </NavLink>
        
        <NavLink 
          to="/logs" 
          className={({ isActive }) => `flex items-center gap-4 py-3 pl-8 transition-colors duration-200 ${isActive ? 'text-primary font-bold border-l-2 border-primary bg-surface/50' : 'text-secondary hover:text-on-surface hover:bg-surface'}`}
        >
          <Terminal size={20} />
          <span className="text-sm font-sans uppercase tracking-widest">Logs</span>
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => `flex items-center gap-4 py-3 pl-8 transition-colors duration-200 ${isActive ? 'text-primary font-bold border-l-2 border-primary bg-surface/50' : 'text-secondary hover:text-on-surface hover:bg-surface'}`}
        >
          <Settings size={20} />
          <span className="text-sm font-sans uppercase tracking-widest">Settings</span>
        </NavLink>
      </nav>

      <div className="px-8 mt-auto">
        <button 
          onClick={() => navigate('/services/new')}
          className="w-full bg-primary text-white py-4 text-xs font-sans uppercase tracking-widest hover:bg-primary-container transition-all active:scale-95 duration-150 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          New Service
        </button>
        
        <div className="mt-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-surface-high overflow-hidden">
            <img 
              src={user?.avatar_url || "https://picsum.photos/seed/user/32/32"} 
              alt={user?.username} 
              className="w-full h-full object-cover grayscale"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium truncate">{user?.username || 'User'}</span>
            <span className="text-[10px] text-secondary truncate">{user?.email || 'Local Node'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="ml-auto text-secondary hover:text-primary transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
