import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// --- TYPESCRIPT INTERFACES ---
interface HistoryLine {
  type: 'system' | 'input' | 'output' | 'error' | 'success' | 'secondary';
  text: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
  link: string;
}

// --- THEME CONSTANTS ---
const THEME = {
  primary: '#D95D39',
  secondary: '#00A896',
  accent: '#F4A261',
  bgDark: '#0A0A0A',
  surface: '#121212',
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: '#1E293B'
};

// --- INTERACTIVE TERMINAL COMPONENT ---
const InteractiveTerminal: React.FC = () => {
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: 'system', text: '// HOLONET Deployment Platform Online...' },
    { type: 'system', text: 'Loading container orchestration... READY' },
    { type: 'system', text: 'Git webhook listeners active... OK' },
    { type: 'system', text: 'Type "help" to view available commands.' }
  ]);
  const [input, setInput] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // FIX: Targeted scrolling that ONLY triggers when history updates (not on every keystroke)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = input.trim();
      setInput(''); 
      
      if (!cmd) {
        setHistory(prev => [...prev, { type: 'input', text: '~ ❯ ' }]);
        return;
      }

      let output: HistoryLine[] = [];
      switch (cmd.toLowerCase()) {
        case 'help':
          output = [
            { type: 'output', text: 'HOLONET COMMANDS:' },
            { type: 'output', text: '  help     - Show this message' },
            { type: 'output', text: '  status   - View platform status' },
            { type: 'output', text: '  deploy   - Deploy new service' },
            { type: 'output', text: '  docs     - View documentation' },
            { type: 'output', text: '  clear    - Clear terminal' }
          ];
          break;
        case 'clear':
          setHistory([]);
          return;
        case 'status':
          output = [
            { type: 'output', text: 'PLATFORM STATUS: OPERATIONAL' },
            { type: 'output', text: 'DEPLOYMENTS: 42 active' },
            { type: 'output', text: 'QUEUE: 3 pending' },
            { type: 'secondary', text: 'DOCKER RUNTIME: HEALTHY' },
            { type: 'secondary', text: 'NGINX PROXY: ACTIVE' }
          ];
          break;
        case 'deploy':
          output = [
            { type: 'output', text: 'Cloning repository... SUCCESS' },
            { type: 'output', text: 'Building Docker image... OK' },
            { type: 'output', text: 'Configuring Nginx proxy... DONE' },
            { type: 'secondary', text: 'SERVICE DEPLOYED: https://myapp.holonet.hitanshu.xyz' }
          ];
          break;
        case 'docs':
          output = [
            { type: 'output', text: 'Opening documentation...' },
            { type: 'secondary', text: '📖 API Reference: /api/docs' },
            { type: 'secondary', text: '📚 User Guide: /docs' },
            { type: 'secondary', text: '🔧 GitHub: github.com/indra55/holonet' }
          ];
          break;
        default:
          output = [{ type: 'error', text: `Command not found: ${cmd}` }];
      }
      
      setHistory(prev => [...prev, { type: 'input', text: `~ ❯ ${cmd}` }, ...output]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      whileInView={{ opacity: 1, scale: 1 }} 
      viewport={{ once: true }} 
      transition={{ duration: 0.8 }} 
      className="w-full lg:w-7/12 rounded-xl overflow-hidden bg-[#0A0A0A] shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-neutral-800 hover:border-[#D95D39]/40 transition-colors duration-700 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="bg-[#121212] px-6 py-4 flex items-center justify-between border-b border-neutral-800">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-red-500/80 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500/80 rounded-full"></div>
          <div className="w-3 h-3 bg-[#00A896]/80 rounded-full"></div>
        </div>
        <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono text-neutral-300">root@holonet-core:~</span>
      </div>
      
      {/* FIX: Added ref here for targeted internal scrolling */}
      <div ref={scrollContainerRef} className="p-8 font-mono text-sm leading-loose overflow-x-hidden overflow-y-auto whitespace-pre-wrap hide-scrollbar h-[350px] relative scroll-smooth">
        {history.map((line, i) => (
          <div key={i} className={`mb-1 ${
            line.type === 'system' ? 'text-neutral-500' :
            line.type === 'input' ? 'text-[#D95D39]' :
            line.type === 'error' ? 'text-red-400' :
            line.type === 'success' ? 'text-green-400' :
            line.type === 'secondary' ? 'text-[#00A896]' :
            'text-neutral-300'
          }`}>
            {line.text}
          </div>
        ))}

        <div className="flex items-center gap-4 text-neutral-200 mt-2">
          <span className="text-[#D95D39] font-bold whitespace-nowrap">~ ❯</span>
          <span className="relative flex-1 flex items-center">
            {input}
            <span className="bg-[#D95D39]/80 w-2 h-4 inline-block ml-1 translate-y-[2px]"></span>
          </span>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="absolute opacity-0 pointer-events-none"
          autoComplete="off"
          spellCheck="false"
          autoFocus
        />
        {/* FIX: Removed the empty div that was causing scroll hijacking */}
      </div>
    </motion.div>
  );
};


// --- 3D TILT CARD COMPONENT ---
// FIX: Added explicit TypeScript Interface for the props
const TiltCard: React.FC<{ feat: Feature }> = ({ feat }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-150, 150], [10, -10]);
  const rotateY = useTransform(x, [-150, 150], [-10, 10]);

  function handleMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left - rect.width / 2);
    y.set(event.clientY - rect.top - rect.height / 2);
  }

  return (
    <motion.div
      onMouseMove={handleMouse}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="bg-[#121212] p-12 relative group cursor-pointer border border-neutral-800 hover:border-[#D95D39]/30 transition-colors duration-500"
    >
      <div style={{ transform: "translateZ(50px)" }}>
        <div className="mb-12 inline-flex p-4 bg-[#D95D39]/10 text-[#D95D39] group-hover:scale-110 group-hover:bg-[#D95D39]/20 group-hover:shadow-[0_0_20px_rgba(217,93,57,0.4)] transition-all duration-500">
          <span className="material-symbols-outlined text-4xl">{feat.icon}</span>
        </div>
        <h3 className="font-headline text-2xl mb-6 text-neutral-100">{feat.title}</h3>
        <p className="text-neutral-400 leading-relaxed mb-12 font-body">{feat.desc}</p>
        <a className="uppercase tracking-widest text-[#D95D39] flex items-center group-hover:translate-x-4 transition-transform text-xs font-body font-bold" href="#">
          {feat.link} <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
        </a>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#D95D39]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" />
    </motion.div>
  );
};

// --- MAIN PAGE COMPONENT ---
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, loading } = useAuth();
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <>
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center font-mono text-[#D95D39] text-sm p-8"
          >
            <div className="max-w-md w-full">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">HOLONET_OS v9.4.1</motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-1 text-neutral-500">INITIALIZING KERNEL...</motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mb-1 text-neutral-500">MOUNTING SECURE VAULT...</motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mb-6 text-neutral-500">ESTABLISHING UPLINK <span className="text-[#00A896]">[OK]</span></motion.div>
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: "100%" }} 
                transition={{ duration: 1.8, ease: "circInOut" }}
                className="h-1 bg-gradient-to-r from-[#D95D39] to-[#ea6944]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#0A0A0A] text-neutral-200 min-h-screen overflow-x-hidden">
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap');

          .font-headline { font-family: 'Noto Serif', serif !important; }
          .font-body { font-family: 'Inter', sans-serif !important; }
          
          .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
          .burn-gradient { background-image: linear-gradient(135deg, #D95D39 0%, #ea6944 100%); }
          .grid-pattern { background-image: radial-gradient(circle, #333 1px, transparent 1px); background-size: 40px 40px; opacity: 0.15; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          
          ::selection { background-color: rgba(217, 93, 57, 0.3); color: white; }
        `}} />

        {/* TopNavBar */}
        <motion.nav 
          initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 2.2, duration: 0.8 }}
          className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-neutral-900"
        >
          <div className="flex justify-between items-center px-6 md:px-12 py-5 w-full mx-auto max-w-screen-2xl">
            <div className="text-xl md:text-2xl font-headline tracking-[0.2em] uppercase text-[#D95D39] select-none flex items-center gap-3">
              <span className="text-3xl text-[#D95D39] font-bold">∞</span>
              HOLONET
            </div>
            <div className="hidden lg:flex items-center space-x-12">
              <a className="font-body font-bold tracking-widest uppercase text-[10px] text-neutral-500 hover:text-[#D95D39] transition-colors duration-300" href="/docs">Documentation</a>
              <a className="font-body font-bold tracking-widest uppercase text-[10px] text-neutral-500 hover:text-[#D95D39] transition-colors duration-300" href="/api/docs">API</a>
              <a className="font-body font-bold tracking-widest uppercase text-[10px] text-neutral-500 hover:text-[#D95D39] transition-colors duration-300" href="https://github.com/indra55/holonet">GitHub</a>
            </div>
            <div className="flex items-center space-x-6">
              <button onClick={login} className="hidden md:block text-neutral-500 font-body font-bold tracking-widest uppercase text-[10px] hover:text-[#D95D39] transition-all">Sign In</button>
              <button onClick={login} className="relative group overflow-hidden bg-[#D95D39]/10 border border-[#D95D39]/30 text-[#D95D39] px-6 py-2 font-body text-[10px] tracking-widest uppercase font-bold hover:scale-105 active:scale-95 transition-all">
                <span className="relative z-10 group-hover:text-[#0A0A0A] transition-colors duration-300">Connect</span>
                <div className="absolute inset-0 burn-gradient translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
              </button>
            </div>
          </div>
        </motion.nav>

        <main>
          {/* Monolith Hero Section */}
          <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden">
            <div className="absolute inset-0 grid-pattern pointer-events-none z-0"></div>
            
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -20, 0], x: [0, 15, 0], opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 5 + i * 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute rounded-full blur-[3px] z-0 ${i % 2 === 0 ? 'bg-[#D95D39]' : 'bg-[#00A896]'}`}
                style={{
                  width: Math.random() * 6 + 2 + 'px',
                  height: Math.random() * 6 + 2 + 'px',
                  top: Math.random() * 80 + 10 + '%',
                  left: Math.random() * 80 + 10 + '%',
                }}
              />
            ))}

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2, duration: 3, ease: "easeOut" }}
              className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-[#D95D39]/5 blur-[150px] rounded-full pointer-events-none"
            />
            
            <motion.div variants={containerVariants} initial="hidden" animate={isBooting ? "hidden" : "visible"} className="relative z-10 max-w-5xl">
              {/* <motion.div variants={itemVariants} className="inline-flex items-center gap-3 mb-8 border border-neutral-800 rounded-full px-4 py-1 bg-[#121212]/80 backdrop-blur-md">
                <div className="w-1.5 h-1.5 bg-[#00A896] rounded-full"></div>
                <span className="uppercase tracking-[0.3em] text-neutral-400 font-body font-bold text-[9px]">Global Network Online</span>
              </motion.div> */}
              
              <motion.h1 variants={itemVariants} className="font-headline text-6xl md:text-8xl lg:text-[7rem] leading-[1] tracking-tight mb-8 text-neutral-100">
                DEPLOY <br /> <span className="italic text-transparent bg-clip-text burn-gradient [background-clip:text] [-webkit-background-clip:text] drop-shadow-[0_0_30px_rgba(217,93,57,0.3)]">WITHOUT LIMITS.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="font-body text-lg md:text-2xl text-neutral-400 max-w-2xl mx-auto mb-16 leading-relaxed">
                Self-hosted deployment platform with Vercel-like experience. Deploy from Git, containerize automatically, and scale on your infrastructure.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={login} className="w-full sm:w-auto px-12 py-5 burn-gradient text-[#0A0A0A] font-body font-black tracking-[0.2em] uppercase text-sm hover:shadow-[0_0_40px_rgba(217,93,57,0.5)] hover:scale-105 transition-all active:scale-95">
                  START DEPLOYING
                </button>
                <button className="w-full sm:w-auto px-12 py-5 border border-neutral-800 text-neutral-300 hover:text-[#D95D39] font-body font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#D95D39]/5 hover:border-[#D95D39]/50 transition-all active:scale-95">
                  VIEW DOCS
                </button>
              </motion.div>
            </motion.div>
          </section>

          {/* Infinite Marquee Section */}
          <div className="w-full bg-[#D95D39] text-[#0A0A0A] py-3 overflow-hidden flex border-y border-[#D95D39]/50">
            <motion.div 
              animate={{ x: [0, -1000] }} 
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="flex whitespace-nowrap font-mono text-[10px] font-bold tracking-[0.3em] uppercase"
            >
              {[...Array(6)].map((_, i) => (
                <span key={i} className="mx-8 flex items-center gap-8">
                  <span>PLATFORM: OPERATIONAL</span> • 
                  <span>DEPLOYMENTS: 42 ACTIVE</span> • 
                  <span>CONTAINERS: 156 RUNNING</span> • 
                  <span>WEBHOOKS: LISTENING</span> •
                </span>
              ))}
            </motion.div>
          </div>

          {/* High-Impact Features */}
          <section className="py-48 px-6 md:px-12 max-w-screen-2xl mx-auto overflow-hidden">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-32 flex flex-col items-center text-center">
              <h2 className="font-headline text-5xl md:text-6xl mb-8 text-neutral-100">Deployment <br /> Infrastructure</h2>
              <div className="w-24 h-1 burn-gradient"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative perspective-1000">
              {[
                { icon: "rocket_launch", title: "Git-Based Deployments", desc: "Push to deploy workflow with automatic containerization. Supports GitHub, GitLab, and Bitbucket with webhook integration.", link: "Learn More" },
                { icon: "dns", title: "Multi-Runtime Support", desc: "Node.js, Python, Go, and static sites. Each deployment gets optimized Docker containers with automatic resource allocation.", link: "View Runtimes" },
                { icon: "security", title: "Self-Hosted Freedom", desc: "Complete control over your infrastructure. No vendor lock-in, arbitrary limits, or surprise bills. Your code, your servers, your rules.", link: "Security Docs" }
              ].map((feat, idx) => (
                <TiltCard key={idx} feat={feat} />
              ))}
            </div>
          </section>

          {/* Terminal Interactive Section */}
          <section className="py-48 bg-[#121212] relative overflow-hidden border-y border-neutral-900">
             <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#D95D39]/5 to-transparent pointer-events-none"></div>
            <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="w-full lg:w-5/12">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#D95D39]/10 text-[#D95D39] mb-8 border border-[#D95D39]/20">
                    <span className="material-symbols-outlined">terminal</span>
                  </span>
                  <h2 className="font-headline text-4xl md:text-5xl mb-8 text-neutral-100">Command Line Interface</h2>
                  <p className="font-body text-neutral-400 leading-relaxed text-lg mb-8">
                    Monitor deployments, check platform status, and manage services through our terminal interface. Try the commands above.
                  </p>
                  <ul className="space-y-4 font-mono text-sm text-neutral-400">
                    <li className="flex items-center gap-3"><span className="text-[#D95D39]">{'>'}</span> Real-time deployment logs</li>
                    <li className="flex items-center gap-3"><span className="text-[#D95D39]">{'>'}</span> Service health monitoring</li>
                    <li className="flex items-center gap-3"><span className="text-[#D95D39]">{'>'}</span> Queue status and metrics</li>
                  </ul>
                </motion.div>
                
                <InteractiveTerminal />

              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative py-64 px-6 overflow-hidden bg-[#0A0A0A] flex justify-center items-center">
            <motion.img 
              initial={{ scale: 1 }} whileInView={{ scale: 1.15 }} transition={{ duration: 15, ease: "linear" }}
              className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity grayscale" alt="Abstract hardware" 
              src="https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=2000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]"></div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10 max-w-4xl mx-auto text-center">
              <h2 className="font-headline text-5xl md:text-8xl mb-8 tracking-tight text-neutral-100">
                DEPLOY ON <span className="text-transparent bg-clip-text burn-gradient [background-clip:text] [-webkit-background-clip:text] drop-shadow-[0_0_20px_rgba(217,93,57,0.4)]">YOUR TERMS.</span>
              </h2>
              <p className="font-body text-xl text-neutral-400 mb-16 max-w-2xl mx-auto leading-relaxed">
                Stop paying for services you don't need. Start deploying with the freedom of open-source.
              </p>
              <div className="inline-block p-[2px] rounded-sm burn-gradient group cursor-pointer hover:shadow-[0_0_40px_rgba(217,93,57,0.4)] transition-shadow duration-500">
                <button onClick={login} className="bg-[#0A0A0A] px-12 md:px-20 py-6 font-body font-black tracking-[0.3em] uppercase text-sm group-hover:bg-transparent group-hover:text-[#0A0A0A] transition-all duration-300 text-neutral-100">
                  GET STARTED
                </button>
              </div>
            </motion.div>
          </section>
        </main>

        <footer className="w-full border-t border-neutral-900 pt-24 pb-12 bg-[#0A0A0A] relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px burn-gradient opacity-30"></div>
          <div className="flex flex-col items-center space-y-16 px-6 max-w-screen-2xl mx-auto relative z-10">
            <div className="text-3xl font-headline uppercase tracking-[0.4em] text-[#D95D39] select-none flex flex-col items-center gap-2">
              <span className="text-5xl text-[#D95D39] font-bold">∞</span>
              HOLONET
            </div>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <a className="text-neutral-600 font-body font-bold uppercase tracking-[0.2em] text-[10px] hover:text-[#D95D39] transition-all hover:scale-105" href="/docs">Documentation</a>
              <a className="text-neutral-600 font-body font-bold uppercase tracking-[0.2em] text-[10px] hover:text-[#D95D39] transition-all hover:scale-105" href="/api/docs">API Reference</a>
              <a className="text-neutral-600 font-body font-bold uppercase tracking-[0.2em] text-[10px] hover:text-[#D95D39] transition-all hover:scale-105" href="https://github.com/indra55/holonet">GitHub</a>
              <a className="text-neutral-600 font-body font-bold uppercase tracking-[0.2em] text-[10px] hover:text-[#D95D39] transition-all hover:scale-105" href="/status">Status</a>
            </div>
            <div className="font-mono text-neutral-700 text-[10px] tracking-[0.2em] flex flex-col items-center gap-2">
              <span>SYSTEM ARCHIVED FOR ETERNITY.</span>
              <span>© {new Date().getFullYear()} HOLONET INFRASTRUCTURE</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;