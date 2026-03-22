import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Zap, Cloud, CheckCircle, Database } from 'lucide-react';
import TopBar from '../components/TopBar';
import { api } from '../services/api';
import { Runtime } from '../types';

const NewServicePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    repo_url: '',
    subdomain: '',
    runtime: 'node' as Runtime,
    branch: 'main',
    root_directory: '.',
    build_cmd: 'npm run build',
    start_cmd: 'npm start',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const service = await api.services.create(formData);
      navigate(`/services/${service.id}`);
    } catch (error) {
      console.error('Failed to create service', error);
      alert('Failed to create service: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="New Service Deployment" breadcrumbs={['Provisioning Protocol']} />
      
      <section className="py-24 px-24 max-w-6xl mx-auto w-full">
        <header className="mb-24">
          <p className="font-sans text-primary text-xs uppercase tracking-[0.3em] mb-4">Provisioning Protocol</p>
          <h2 className="font-serif text-5xl font-bold tracking-tighter leading-none text-on-surface">New Service Deployment</h2>
        </header>

        <form onSubmit={handleSubmit} className="space-y-32">
          {/* Step 01: Repository */}
          <div className="grid grid-cols-12 gap-12 group">
            <div className="col-span-4">
              <span className="font-serif text-[8rem] leading-none text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700">01</span>
              <h3 className="font-serif text-2xl mt-4">Repository</h3>
              <p className="text-secondary text-sm mt-2 max-w-xs font-light leading-relaxed">Connect your source authority. Select a versioned repository to initialize the sync sequence.</p>
            </div>
            <div className="col-span-8 flex flex-col justify-end">
              <div className="space-y-12">
                <div className="relative">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Service Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm" 
                    placeholder="my-awesome-api" 
                    type="text" 
                  />
                </div>
                <div className="relative">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Repository URL</label>
                  <input 
                    required
                    value={formData.repo_url}
                    onChange={e => setFormData({ ...formData, repo_url: e.target.value })}
                    className="w-full bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm" 
                    placeholder="https://github.com/user/repo" 
                    type="url" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="relative">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Branch Authority</label>
                    <input 
                      value={formData.branch}
                      onChange={e => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm" 
                      placeholder="main" 
                      type="text" 
                    />
                  </div>
                  <div className="relative">
                    <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Subdomain</label>
                    <div className="flex items-center">
                      <input 
                        required
                        value={formData.subdomain}
                        onChange={e => setFormData({ ...formData, subdomain: e.target.value })}
                        className="flex-1 bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm" 
                        placeholder="my-app" 
                        type="text" 
                      />
                      <span className="text-secondary text-xs ml-2">.holonet.io</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 02: Runtime */}
          <div className="grid grid-cols-12 gap-12 group">
            <div className="col-span-4">
              <span className="font-serif text-[8rem] leading-none text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700">02</span>
              <h3 className="font-serif text-2xl mt-4">Runtime</h3>
              <p className="text-secondary text-sm mt-2 max-w-xs font-light leading-relaxed">Define the execution environment. High-performance containers with isolated resource allocation.</p>
            </div>
            <div className="col-span-8 flex flex-col justify-end">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['node', 'python', 'go', 'static'] as Runtime[]).map(r => (
                  <div 
                    key={r}
                    onClick={() => setFormData({ ...formData, runtime: r })}
                    className={`p-6 bg-surface border cursor-pointer transition-all flex flex-col items-center text-center ${formData.runtime === r ? 'border-primary bg-surface-high' : 'border-outline/10 hover:border-primary/50'}`}
                  >
                    {r === 'node' && <Cpu size={24} className="text-primary mb-4" />}
                    {r === 'python' && <Zap size={24} className="text-primary mb-4" />}
                    {r === 'go' && <Cloud size={24} className="text-primary mb-4" />}
                    {r === 'static' && <Database size={24} className="text-primary mb-4" />}
                    <p className="font-sans text-[10px] uppercase tracking-widest text-on-surface">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 03: Build */}
          <div className="grid grid-cols-12 gap-12 group">
            <div className="col-span-4">
              <span className="font-serif text-[8rem] leading-none text-primary opacity-20 group-hover:opacity-100 transition-opacity duration-700">03</span>
              <h3 className="font-serif text-2xl mt-4">Build</h3>
              <p className="text-secondary text-sm mt-2 max-w-xs font-light leading-relaxed">Construct the application artifacts. Automated CI/CD pipeline injection for archival stability.</p>
            </div>
            <div className="col-span-8 flex flex-col justify-end">
              <div className="space-y-12">
                <div className="relative">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Build Command</label>
                  <input 
                    value={formData.build_cmd}
                    onChange={e => setFormData({ ...formData, build_cmd: e.target.value })}
                    className="w-full bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm font-mono" 
                    placeholder="npm run build" 
                    type="text" 
                  />
                </div>
                <div className="relative">
                  <label className="font-sans text-[10px] uppercase tracking-widest text-secondary block mb-2">Start Command</label>
                  <input 
                    value={formData.start_cmd}
                    onChange={e => setFormData({ ...formData, start_cmd: e.target.value })}
                    className="w-full bg-surface border-none border-b border-outline/40 focus:border-primary focus:ring-0 text-on-surface py-4 px-6 text-sm font-mono" 
                    placeholder="npm start" 
                    type="text" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Final Action */}
          <div className="mt-32 pt-24 border-t border-outline/10 flex justify-between items-end">
            <div className="max-w-md">
              <p className="font-sans text-[10px] text-secondary uppercase tracking-[0.2em] mb-2">Final Confirmation</p>
              <p className="text-on-surface italic font-serif text-lg">"The integrity of the archive depends on the precision of its initialization."</p>
            </div>
            <button 
              disabled={loading}
              type="submit"
              className="bg-primary text-white px-16 py-6 font-sans uppercase tracking-[0.3em] text-sm hover:bg-primary-container transition-all scale-100 active:scale-95 duration-150 font-bold disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize'}
            </button>
          </div>
        </form>
      </section>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-64 right-0 h-16 bg-background border-t border-outline/5 flex items-center px-12 z-50">
        <div className="flex items-center gap-12 w-full">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-primary animate-pulse"></span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-secondary">Simulation Mode Active</span>
          </div>
          <div className="h-4 w-[1px] bg-outline/30"></div>
          <div className="flex gap-8 flex-1">
            <div className="flex flex-col">
              <span className="font-sans text-[8px] uppercase tracking-widest text-secondary/60">Est. Latency</span>
              <span className="font-serif text-xs text-on-surface">12.4ms <span className="text-primary text-[8px]">▼</span></span>
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-[8px] uppercase tracking-widest text-secondary/60">Node Integrity</span>
              <span className="font-serif text-xs text-on-surface">99.98%</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-sans text-[9px] uppercase tracking-widest text-secondary">Ready for sequence</span>
            <CheckCircle size={18} className="text-primary" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewServicePage;
