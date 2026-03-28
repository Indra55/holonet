import React from 'react';
import { Terminal } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { user, login, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden bg-[#0A0A0A]">
      <main className="flex-grow flex items-center justify-center px-6 relative">
        {/* Background Textural Element */}
        <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-[20vw] font-bold select-none text-[#1E293B]">HOLONET</span>
        </div>
        
        {/* Login Card */}
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-[#121212] p-12 md:p-16 flex flex-col items-center border border-[#1E293B]/15">
            {/* Brand Anchor */}
            <div className="mb-12 text-center">
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-2 tracking-tighter">Holonet</h1>
              <p className="text-[10px] uppercase text-[#94A3B8]">V1.0.42 / Core Terminal</p>
            </div>
            
            {/* Editorial Content */}
            <div className="mb-12 text-center max-w-xs">
              <p className="font-serif italic text-lg text-[#94A3B8] leading-relaxed">
                Access the secure vault of historical deployments and system logs.
              </p>
            </div>
            
            {/* Primary Action */}
            <div className="w-full space-y-8">
              <button 
                onClick={login}
                className="w-full h-16 bg-gradient-to-br from-[#D95D39] to-[#ea6944] text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
              >
                <Terminal size={20} />
                <span className="font-sans text-sm uppercase tracking-widest font-bold">Login with GitHub</span>
              </button>
              
              <div className="flex items-center gap-4">
                <div className="flex-grow h-[1px] bg-[#1E293B]/20"></div>
                <span className="text-[10px] uppercase text-[#1E293B]">Authorized Only</span>
                <div className="flex-grow h-[1px] bg-[#1E293B]/20"></div>
              </div>
              
              <div className="flex justify-center">
                <a className="text-[#94A3B8] text-[10px] uppercase hover:text-[#D95D39] transition-colors border-b border-[#1E293B]/30 pb-1" href="#">Request Access Credentials</a>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer Status Bar */}
      <footer className="w-full px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-[#1E293B]/10 bg-[#0A0A0A]">
        <div className="flex items-center gap-4 group">
          <div className="w-2 h-2 rounded-full bg-[#D95D39] animate-pulse"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-[#1E293B]">Archive Status</span>
            <span className="font-serif text-sm font-bold text-white">Live / Synced</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <span className="text-[10px] uppercase text-[#1E293B]">System Ref</span>
            <span className="font-serif text-sm font-bold text-white">HN-CORE-992-B</span>
          </div>
          <div className="h-10 w-[1px] bg-[#1E293B]/20 mx-4 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img alt="System User" className="w-8 h-8 rounded-full border-2 border-background object-cover" src="https://picsum.photos/seed/u1/32/32" />
              <img alt="System Admin" className="w-8 h-8 rounded-full border-2 border-background object-cover" src="https://picsum.photos/seed/u2/32/32" />
            </div>
            <span className="text-[10px] uppercase text-[#94A3B8]">2 Active Archivists</span>
          </div>
        </div>
      </footer>
      
      {/* Decorative Corner Accents */}
      <div className="fixed top-0 left-0 p-8 pointer-events-none">
        <div className="w-12 h-[1px] bg-[#1E293B]/40 mb-3"></div>
        <div className="w-[1px] h-12 bg-[#1E293B]/40"></div>
      </div>
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none">
        <div className="w-[1px] h-12 bg-[#1E293B]/40 ml-auto"></div>
        <div className="w-12 h-[1px] bg-[#1E293B]/40 mt-3"></div>
      </div>
    </div>
  );
};

export default LoginPage;
