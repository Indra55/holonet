import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, Settings, Trash2, Play, ExternalLink, Plus, X, Save, Clock, GitBranch, Hash } from 'lucide-react';
import TopBar from '../components/TopBar';
import { api } from '../services/api';
import { Service, Deployment } from '../types';

const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'env' | 'deployments' | 'settings'>('overview');
  
  // Env vars state
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');
  const [savingEnv, setSavingEnv] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    try {
      const serviceData = await api.services.get(id);
      setService(serviceData);
      setEnvVars(serviceData.env_vars || {});
      
      const deploymentsData = await api.services.getDeployments(id);
      setDeployments(deploymentsData);
    } catch (error) {
      console.error('Failed to fetch service details', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDeploy = async () => {
    if (!id) return;
    setDeploying(true);
    try {
      const { deploymentId } = await api.services.deploy(id);
      navigate(`/services/${id}/deployments/${deploymentId}`);
    } catch (error) {
      console.error('Deployment failed', error);
      alert('Deployment failed: ' + (error as Error).message);
    } finally {
      setDeploying(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !service) return;
    if (confirm(`Are you sure you want to delete ${service.name}? This action is irreversible.`)) {
      try {
        await api.services.delete(id);
        navigate('/dashboard');
      } catch (error) {
        console.error('Delete failed', error);
        alert('Delete failed: ' + (error as Error).message);
      }
    }
  };

  const handleAddEnv = () => {
    if (!newEnvKey) return;
    setEnvVars(prev => ({ ...prev, [newEnvKey]: newEnvValue }));
    setNewEnvKey('');
    setNewEnvValue('');
  };

  const handleRemoveEnv = (key: string) => {
    const newVars = { ...envVars };
    delete newVars[key];
    setEnvVars(newVars);
  };

  const handleSaveEnv = async () => {
    if (!id) return;
    setSavingEnv(true);
    try {
      await api.services.updateEnv(id, envVars);
      alert('Environment variables updated successfully.');
    } catch (error) {
      console.error('Failed to save env vars', error);
      alert('Failed to save environment variables.');
    } finally {
      setSavingEnv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-[#D95D39] animate-pulse font-serif italic text-2xl">Accessing Service Archive...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-red-500 font-serif italic text-2xl">Service Not Found</div>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-[#94A3B8] hover:text-[#D95D39] transition-colors">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A]">
      <TopBar title={service.name} breadcrumbs={['Services', service.id.slice(0, 8)]} />
      
      <div className="p-12">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-5xl font-serif font-bold">{service.name}</h1>
              <span className={`px-3 py-1 border text-[10px] font-sans uppercase tracking-widest ${service.status === 'deployed' ? 'bg-[#D95D39]/10 border-[#D95D39]/20 text-[#D95D39]' : 'bg-[#00A896]/10 border-[#00A896]/20 text-[#00A896]'}`}>
                {service.status}
              </span>
            </div>
            <div className="flex items-center gap-6 text-[#94A3B8] text-xs uppercase">
              <div className="flex items-center gap-2">
                <GitBranch size={14} />
                <span>{service.branch}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash size={14} />
                <span>{service.id}</span>
              </div>
              <a 
                href={service.deploy_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#D95D39] hover:underline"
              >
                <ExternalLink size={14} />
                <span>{service.subdomain}.hitanshu.xyz</span>
              </a>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={handleDeploy}
              disabled={deploying}
              className="bg-[#D95D39] text-white px-8 py-4 text-xs font-sans uppercase tracking-widest hover:bg-[#ea6944] transition-all flex items-center gap-2 font-bold disabled:opacity-50"
            >
              <Play size={16} />
              {deploying ? 'Deploying...' : 'Trigger Deploy'}
            </button>
            <button 
              onClick={handleDelete}
              className="bg-[#121212] border border-red-500/30 text-red-500 px-8 py-4 text-xs font-sans uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2 font-bold"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-12 border-b border-[#1E293B]/10 mb-12">
          {(['overview', 'env', 'deployments', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-sans uppercase tracking-widest transition-all ${activeTab === tab ? 'text-[#D95D39] border-b-2 border-[#D95D39] font-bold' : 'text-[#94A3B8] hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-12">
                <div className="bg-[#121212] p-10 border border-[#1E293B]/15">
                  <h3 className="text-xl font-serif mb-6">Service Identity</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between border-b border-[#1E293B]/5 pb-4">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Runtime</span>
                      <span className="text-sm uppercase">{service.runtime}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E293B]/5 pb-4">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Repository</span>
                      <span className="text-sm truncate max-w-[200px]">{service.repo_url}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E293B]/5 pb-4">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Root Directory</span>
                      <span className="text-sm">{service.root_directory}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#121212] p-10 border border-[#1E293B]/15">
                  <h3 className="text-xl font-serif mb-6">Build Configuration</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Build Command</span>
                      <code className="bg-[#0A0A0A] p-3 text-xs font-mono text-[#D95D39]">{service.build_cmd}</code>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest">Start Command</span>
                      <code className="bg-[#0A0A0A] p-3 text-xs font-mono text-[#D95D39]">{service.start_cmd}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-12">
                <div className="bg-[#121212] p-10 border border-[#1E293B]/15">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-serif">Latest Deployment</h3>
                    <button 
                      onClick={() => setActiveTab('deployments')}
                      className="text-[10px] text-[#D95D39] uppercase tracking-widest hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  {deployments.length > 0 ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${deployments[0].status === 'success' ? 'bg-[#D95D39]' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold uppercase tracking-widest">{deployments[0].status}</span>
                      </div>
                      <p className="text-sm text-[#94A3B8] italic font-serif">"{deployments[0].commit_message}"</p>
                      <div className="flex justify-between text-[10px] text-[#94A3B8] uppercase tracking-widest">
                        <span>{deployments[0].commit_author}</span>
                        <span>{new Date(deployments[0].created_at).toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => navigate(`/services/${id}/deployments/${deployments[0].id}`)}
                        className="w-full bg-[#1A1A1A] py-3 text-[10px] font-sans uppercase tracking-widest hover:bg-[#D95D39]/10 hover:text-[#D95D39] transition-all flex items-center justify-center gap-2"
                      >
                        <Terminal size={14} />
                        Inspect Logs
                      </button>
                    </div>
                  ) : (
                    <p className="text-[#94A3B8] italic text-sm">No deployments recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="bg-[#121212] p-12 border border-[#1E293B]/15">
              <header className="flex justify-between items-end mb-12">
                <div>
                  <h3 className="text-3xl font-serif mb-2">Environment Vault</h3>
                  <p className="text-[#94A3B8] text-[10px] uppercase">Secure configuration variables for runtime injection</p>
                </div>
                <button 
                  onClick={handleSaveEnv}
                  disabled={savingEnv}
                  className="bg-[#D95D39] text-white px-8 py-3 text-[10px] font-sans uppercase tracking-widest hover:bg-[#ea6944] transition-all flex items-center gap-2 font-bold disabled:opacity-50"
                >
                  <Save size={14} />
                  {savingEnv ? 'Saving...' : 'Save Changes'}
                </button>
              </header>

              <div className="space-y-4 mb-12">
                {Object.entries(envVars).map(([key, value]) => (
                  <div key={key} className="flex gap-4 group">
                    <div className="flex-1 bg-[#0A0A0A] p-4 text-sm font-mono text-[#94A3B8]/60 border border-[#1E293B]/5">{key}</div>
                    <div className="flex-[2] bg-[#0A0A0A] p-4 text-sm font-mono text-white border border-[#1E293B]/5 relative">
                      <input 
                        type="text" 
                        value={value} 
                        onChange={e => setEnvVars(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full bg-transparent border-none focus:ring-0 p-0"
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveEnv(key)}
                      className="p-4 text-[#94A3B8] hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-12 border-t border-[#1E293B]/10">
                <h4 className="text-xs font-sans uppercase tracking-widest text-[#94A3B8] mb-6">Add New Variable</h4>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    placeholder="KEY (e.g. API_SECRET)" 
                    value={newEnvKey}
                    onChange={e => setNewEnvKey(e.target.value)}
                    className="flex-1 bg-[#0A0A0A] border border-[#1E293B]/20 p-4 text-sm font-mono focus:border-[#D95D39] focus:ring-0"
                  />
                  <input 
                    type="text" 
                    placeholder="VALUE" 
                    value={newEnvValue}
                    onChange={e => setNewEnvValue(e.target.value)}
                    className="flex-[2] bg-[#0A0A0A] border border-[#1E293B]/20 p-4 text-sm font-mono focus:border-[#D95D39] focus:ring-0"
                  />
                  <button 
                    onClick={handleAddEnv}
                    className="bg-[#1A1A1A] px-8 text-[10px] font-sans uppercase tracking-widest hover:bg-[#D95D39]/10 hover:text-[#D95D39] transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="space-y-6">
              {deployments.length === 0 ? (
                <div className="bg-[#121212] p-12 text-center border border-[#1E293B]/15">
                  <p className="text-[#94A3B8] italic font-serif">No deployment history found.</p>
                </div>
              ) : (
                deployments.map(deploy => (
                  <div 
                    key={deploy.id}
                    onClick={() => navigate(`/services/${id}/deployments/${deploy.id}`)}
                    className="bg-[#121212] p-8 border border-[#1E293B]/15 flex items-center justify-between group hover:bg-[#1A1A1A] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-3 h-3 rounded-full ${deploy.status === 'success' ? 'bg-primary' : deploy.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold uppercase tracking-widest">{deploy.status}</span>
                          <span className="text-[10px] text-secondary/50 font-mono">#{deploy.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm font-serif italic text-[#94A3B8]">"{deploy.commit_message}"</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">
                          <Clock size={12} />
                          <span>{deploy.duration_seconds != null ? `${deploy.duration_seconds}s` : '...'}</span>
                        </div>
                        <span className="text-[10px] text-[#94A3B8]/40 uppercase tracking-widest">{new Date(deploy.created_at).toLocaleString()}</span>
                      </div>
                      <Terminal size={18} className="text-[#94A3B8] group-hover:text-[#D95D39] transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-[#121212] p-12 border border-[#1E293B]/15">
              <h3 className="text-3xl font-serif mb-12">System Settings</h3>
              <div className="space-y-12">
                <div className="max-w-md">
                  <h4 className="text-xs font-sans uppercase tracking-widest text-white mb-2">Danger Zone</h4>
                  <p className="text-[#94A3B8] text-sm mb-6">Permanently remove this service and all associated deployment history from the Holonet archive.</p>
                  <button 
                    onClick={handleDelete}
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-500 py-4 text-xs font-sans uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all font-bold"
                  >
                    Destroy Service Archive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;
