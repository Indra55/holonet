import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Clock, GitBranch, Hash, ArrowRight, Filter } from 'lucide-react';
import TopBar from '../components/TopBar';
import { api } from '../services/api';
import { Service, Deployment } from '../types';

const LogsPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [allDeployments, setAllDeployments] = useState<(Deployment & { serviceName: string; serviceId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'building'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get all services
        const servicesData = await api.services.list();
        setServices(servicesData.services);

        // Get deployments for each service
        const deploymentsPromises = servicesData.services.map(async (service) => {
          try {
            const deployments = await api.services.getDeployments(service.id);
            return deployments.map(deployment => ({
              ...deployment,
              serviceName: service.name,
              serviceId: service.id
            }));
          } catch (error) {
            console.error(`Failed to fetch deployments for service ${service.id}:`, error);
            return [];
          }
        });

        const allDeploymentsData = await Promise.all(deploymentsPromises);
        const flattenedDeployments = allDeploymentsData.flat();
        
        // Sort by creation date (newest first)
        flattenedDeployments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setAllDeployments(flattenedDeployments);
      } catch (error) {
        console.error('Failed to fetch logs data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDeployments = allDeployments.filter(deployment => {
    if (filter === 'all') return true;
    return deployment.status === filter;
  });

  const getStatusColor = (status: Deployment['status']) => {
    switch (status) {
      case 'success': return 'text-[#D95D39]';
      case 'failed': return 'text-red-500';
      case 'building':
      case 'queued':
      case 'pushing_image':
      case 'deploying': return 'text-yellow-500';
      default: return 'text-[#94A3B8]';
    }
  };

  const getStatusBg = (status: Deployment['status']) => {
    switch (status) {
      case 'success': return 'bg-[#D95D39]/10 border-[#D95D39]/20';
      case 'failed': return 'bg-red-500/10 border-red-500/20';
      case 'building':
      case 'queued':
      case 'pushing_image':
      case 'deploying': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-[#94A3B8]/10 border-[#94A3B8]/20';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-[#D95D39] animate-pulse font-serif italic text-2xl">Loading Archive...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A]">
      <TopBar title="System Logs" breadcrumbs={['Archive']} />
      
      <div className="p-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-serif mb-2 text-white">Deployment Archive</h2>
            <p className="text-[#94A3B8] text-sm">System-wide deployment history and logs</p>
          </div>
          
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-[#94A3B8]" />
            <div className="flex gap-2">
              {(['all', 'success', 'failed', 'building'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 text-xs font-sans uppercase tracking-widest border transition-all ${
                    filter === status 
                      ? 'border-[#D95D39] text-[#D95D39] bg-[#D95D39]/10' 
                      : 'border-[#1E293B]/30 text-[#94A3B8] hover:border-[#94A3B8]/50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#121212] p-6 border border-[#1E293B]/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94A3B8] text-sm">Total Deployments</span>
              <Hash size={16} className="text-[#94A3B8]" />
            </div>
            <div className="text-2xl font-serif text-white">{allDeployments.length}</div>
          </div>
          
          <div className="bg-[#121212] p-6 border border-[#1E293B]/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94A3B8] text-sm">Successful</span>
              <div className="w-2 h-2 rounded-full bg-[#D95D39]"></div>
            </div>
            <div className="text-2xl font-serif text-[#D95D39]">
              {allDeployments.filter(d => d.status === 'success').length}
            </div>
          </div>
          
          <div className="bg-[#121212] p-6 border border-[#1E293B]/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94A3B8] text-sm">Failed</span>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
            <div className="text-2xl font-serif text-red-500">
              {allDeployments.filter(d => d.status === 'failed').length}
            </div>
          </div>
          
          <div className="bg-[#121212] p-6 border border-[#1E293B]/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#94A3B8] text-sm">Active Services</span>
              <Terminal size={16} className="text-[#94A3B8]" />
            </div>
            <div className="text-2xl font-serif text-white">{services.length}</div>
          </div>
        </div>

        {/* Deployments List */}
        <div className="space-y-4">
          {filteredDeployments.length === 0 ? (
            <div className="text-center py-12 bg-[#121212] border border-[#1E293B]/15">
              <p className="text-[#94A3B8] font-serif italic text-lg">
                {filter === 'all' ? 'No deployments found' : `No ${filter} deployments found`}
              </p>
            </div>
          ) : (
            filteredDeployments.map((deployment) => (
              <div 
                key={deployment.id}
                className="bg-[#121212] border border-[#1E293B]/15 p-6 hover:bg-[#1A1A1A] transition-all cursor-pointer group"
                onClick={() => navigate(`/services/${deployment.serviceId}/deployments/${deployment.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Status */}
                    <div className={`px-3 py-1 border text-[10px] font-sans uppercase tracking-widest ${getStatusBg(deployment.status)} ${getStatusColor(deployment.status)}`}>
                      {deployment.status}
                    </div>
                    
                    {/* Service Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-white font-semibold">{deployment.serviceName}</span>
                        <span className="text-[#94A3B8]/40">#{deployment.id.slice(0, 8)}</span>
                      </div>
                      <p className="text-[#94A3B8] text-sm font-serif italic">
                        "{deployment.commit_message || 'No commit message'}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    {/* Time Info */}
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end text-[10px] text-[#94A3B8] uppercase tracking-widest mb-1">
                        <Clock size={12} />
                        <span>{deployment.duration_seconds != null ? `${deployment.duration_seconds}s` : '...'}</span>
                      </div>
                      <span className="text-[10px] text-[#94A3B8]/40 uppercase tracking-widest">
                        {new Date(deployment.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    {/* Navigation */}
                    <ArrowRight size={20} className="text-[#94A3B8] group-hover:text-[#D95D39] transition-colors" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
