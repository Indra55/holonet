import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Terminal, Database, Plus } from 'lucide-react';
import TopBar from '../components/TopBar';
import { api } from '../services/api';
import { Service } from '../types';

const StatusBadge: React.FC<{ status: Service['status'] }> = ({ status }) => {
  const colors = {
    deployed: 'bg-primary/10 border-primary/20 text-primary',
    pending_deployment: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500',
    created: 'bg-secondary/10 border-secondary/20 text-secondary',
    failed: 'bg-red-500/10 border-red-500/20 text-red-500',
  };

  return (
    <span className={`px-3 py-1 border text-[9px] font-sans uppercase tracking-widest ${colors[status] || colors.created}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const DashboardPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.services.list();
        setServices(data.services);
      } catch (error) {
        console.error('Failed to fetch services', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <TopBar title="System Overview" breadcrumbs={['Metrics']} />
      
      <div className="p-12 space-y-24">
        {/* Hero Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col border-l border-outline/20 pl-8">
            <span className="text-[10px] font-sans uppercase tracking-widest text-secondary mb-4">Core Integrity</span>
            <h3 className="text-6xl serif-display font-bold">99.9<span className="text-primary text-2xl">%</span></h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-sans uppercase tracking-widest text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              Nominal Operation
            </div>
          </div>
          <div className="flex flex-col border-l border-outline/20 pl-8">
            <span className="text-[10px] font-sans uppercase tracking-widest text-secondary mb-4">Network Latency</span>
            <h3 className="text-6xl serif-display font-bold">14<span className="text-primary text-2xl">ms</span></h3>
            <p className="mt-4 text-[10px] font-sans uppercase tracking-widest text-secondary/50">Global Average Response</p>
          </div>
          <div className="flex flex-col border-l border-outline/20 pl-8">
            <span className="text-[10px] font-sans uppercase tracking-widest text-secondary mb-4">Throughput</span>
            <h3 className="text-6xl serif-display font-bold">4.2<span className="text-primary text-2xl">tb/s</span></h3>
            <p className="mt-4 text-[10px] font-sans uppercase tracking-widest text-secondary/50">Peak Load Index</p>
          </div>
        </section>

        {/* Active Services Grid */}
        <section>
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl serif-display mb-2">Active Services</h2>
              <p className="text-secondary label-caps text-[10px] uppercase">Monitoring {services.length} distributed instances</p>
            </div>
            <button 
              onClick={() => navigate('/services/new')}
              className="text-[10px] font-sans uppercase tracking-widest border-b border-outline/30 pb-1 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
            >
              <Plus size={12} />
              New Service
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface p-10 min-h-[320px] animate-pulse ghost-border" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-24 bg-surface ghost-border">
              <p className="text-secondary serif-display italic text-xl">No services found. Deploy your first application to get started.</p>
              <button 
                onClick={() => navigate('/services/new')}
                className="mt-8 bg-primary px-8 py-4 text-xs font-sans uppercase tracking-widest text-white font-bold"
              >
                Create Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {services.map(service => (
                <div 
                  key={service.id} 
                  onClick={() => navigate(`/services/${service.id}`)}
                  className="group relative bg-surface p-10 flex flex-col justify-between min-h-[320px] transition-all duration-300 hover:bg-surface-high cursor-pointer ghost-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-sans uppercase tracking-widest text-secondary/40 mb-1 block">Cluster-{service.id.slice(0, 2)}</span>
                      <h4 className="text-2xl serif-display">{service.name}</h4>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                  
                  <div className="my-8 h-24 flex items-end gap-1 overflow-hidden">
                    {/* Visual Data Representation */}
                    <div className="w-full h-8 bg-outline/10 relative">
                      <div className={`absolute inset-0 bg-primary/20 ${service.status === 'deployed' ? 'w-full' : 'w-1/3 animate-pulse'}`}></div>
                      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-outline/20"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-8 border-t border-outline/10">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[9px] font-sans uppercase tracking-widest text-secondary/50">Runtime</p>
                        <p className="text-sm uppercase">{service.runtime}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-sans uppercase tracking-widest text-secondary/50">Subdomain</p>
                        <p className="text-sm">{service.subdomain}.holonet.io</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <Terminal size={18} className="text-secondary group-hover:text-primary transition-colors" />
                      <ArrowUpRight size={18} className="text-secondary group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Activity Ledger */}
        <section className="max-w-4xl">
          <h2 className="text-2xl serif-display mb-8">System Ledger</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-12 group">
              <span className="text-[10px] font-sans text-secondary/40 w-24">12:45:01</span>
              <div className="h-px flex-1 bg-outline/10"></div>
              <p className="text-sm label-caps group-hover:text-primary transition-colors">Deployment successful: Mercury.API v2.4.0</p>
            </div>
            <div className="flex items-center gap-12 group">
              <span className="text-[10px] font-sans text-secondary/40 w-24">12:30:12</span>
              <div className="h-px flex-1 bg-outline/10"></div>
              <p className="text-sm label-caps text-red-500">Anomaly detected in Relay.Lighthouse</p>
            </div>
            <div className="flex items-center gap-12 group">
              <span className="text-[10px] font-sans text-secondary/40 w-24">11:15:44</span>
              <div className="h-px flex-1 bg-outline/10"></div>
              <p className="text-sm label-caps">System purge: Cache cleared in Cluster-01</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
