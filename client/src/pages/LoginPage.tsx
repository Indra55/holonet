import React from 'react';
import { Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { user, login, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden bg-background">
      <main className="flex-grow flex items-center justify-center px-6 relative">
        {/* Background Textural Element */}
        <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
          <span className="serif-display text-[20vw] font-bold select-none text-outline">HOLONET</span>
        </div>
        
        {/* Login Card */}
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-surface p-12 md:p-16 flex flex-col items-center ghost-border">
            {/* Brand Anchor */}
            <div className="mb-12 text-center">
              <h1 className="serif-display text-4xl md:text-5xl font-bold text-on-surface mb-2 tracking-tighter">Holonet</h1>
              <p className="label-caps text-secondary">V1.0.42 / Core Terminal</p>
            </div>
            
            {/* Editorial Content */}
            <div className="mb-12 text-center max-w-xs">
              <p className="serif-display italic text-lg text-secondary leading-relaxed">
                Access the secure vault of historical deployments and system logs.
              </p>
            </div>
            
            {/* Primary Action */}
            <div className="w-full space-y-8">
              <button 
                onClick={login}
                className="w-full h-16 burnt-gradient text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
              >
                <Terminal size={20} />
                <span className="font-sans text-sm uppercase tracking-widest font-bold">Login with GitHub</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="flex-grow h-[1px] bg-outline/20"></div>
                <span className="label-caps text-outline">Authorized Only</span>
                <div className="flex-grow h-[1px] bg-outline/20"></div>
              </div>
              
              <div className="flex justify-center">
                <a className="text-secondary label-caps hover:text-primary transition-colors border-b border-outline/30 pb-1" href="#">Request Access Credentials</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="w-full px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline/10 bg-background">
        <div className="flex items-center gap-4 group">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <div className="flex flex-col">
            <span className="label-caps text-outline text-[10px]">Archive Status</span>
            <span className="serif-display text-sm font-bold text-on-surface">Live / Synced</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="label-caps text-outline text-[10px]">System Ref</span>
            <span className="serif-display text-sm font-bold text-on-surface">HN-CORE-992-B</span>
          </div>
          <div className="h-10 w-[1px] bg-outline/20 mx-4 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img alt="System User" className="w-8 h-8 rounded-full border-2 border-background object-cover" src="https://picsum.photos/seed/u1/32/32" />
              <img alt="System Admin" className="w-8 h-8 rounded-full border-2 border-background object-cover" src="https://picsum.photos/seed/u2/32/32" />
            </div>
            <span className="label-caps text-secondary text-[10px]">2 Active Archivists</span>
          </div>
        </div>
      </footer>
      
      {/* Decorative Corner Accents */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none">
        <div className="w-12 h-[1px] bg-outline/40 mb-3"></div>
        <div className="w-[1px] h-12 bg-outline/40"></div>
      </div>
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none">
        <div className="w-[1px] h-12 bg-outline/40 ml-auto"></div>
        <div className="w-12 h-[1px] bg-outline/40 mt-3"></div>
      </div>
    </div>
  );
};

export default LoginPage;
