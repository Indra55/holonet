import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal, ArrowLeft, Clock, GitBranch, Hash, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import { api } from '../services/api';
import { Deployment, Service, LogEvent } from '../types';

const DeploymentLogPage: React.FC = () => {
  const { id: serviceId, deploymentId } = useParams<{ id: string; deploymentId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<Deployment['status'] | 'connecting'>('connecting');
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    if (!serviceId || !deploymentId) return;

    const fetchData = async () => {
      try {
        const serviceData = await api.services.get(serviceId);
        setService(serviceData);
        
        // Initial logs and status
        const initialLogs = await api.services.getLogs(serviceId, deploymentId);
        setLogs(initialLogs.split('\n'));
        
        // Find the deployment in the list
        const deployments = await api.services.getDeployments(serviceId);
        const currentDeployment = deployments.find(d => d.id === deploymentId);
        if (currentDeployment) {
          setDeployment(currentDeployment);
          setStatus(currentDeployment.status);
        }
      } catch (error) {
        console.error('Failed to fetch deployment details', error);
      }
    };

    fetchData();

    // SSE for live logs
    const eventSource = new EventSource(api.services.getLogStreamUrl(serviceId, deploymentId), {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const data: LogEvent = JSON.parse(event.data);
        if (data.log) {
          setLogs(prev => [...prev, data.log]);
        }
        if (data.status) {
          setStatus(data.status as Deployment['status']);
        }
        if (data.type === 'done') {
          eventSource.close();
        }
      } catch (error) {
        console.error('Failed to parse log event', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [serviceId, deploymentId]);

  if (!service || !deploymentId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-primary animate-pulse font-serif italic text-2xl">Connecting to Terminal...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <TopBar title="Terminal Access" breadcrumbs={['Services', service.name, 'Logs']} />
      
      <div className="flex-1 flex flex-col p-12 overflow-hidden">
        {/* Header Info */}
        <div className="flex justify-between items-end mb-12">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate(`/services/${serviceId}`)}
              className="p-4 bg-surface border border-outline/10 hover:border-primary transition-all group"
            >
              <ArrowLeft size={20} className="text-secondary group-hover:text-primary transition-colors" />
            </button>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl serif-display font-bold">Deployment Terminal</h2>
                <div className={`flex items-center gap-2 px-3 py-1 border text-[10px] font-sans uppercase tracking-widest ${status === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'}`}>
                  {status === 'connecting' ? <Loader2 size={12} className="animate-spin" /> : status}
                </div>
              </div>
              <div className="flex items-center gap-6 text-secondary label-caps text-[10px]">
                <div className="flex items-center gap-2">
                  <GitBranch size={12} />
                  <span>{service.branch}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash size={12} />
                  <span>ID: {deploymentId.slice(0, 12)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} />
                  <span>Started: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] text-secondary/40 font-mono mb-1 uppercase tracking-widest">Node: HN-CORE-992-B</p>
            <p className="text-xs font-serif italic text-on-surface">"Observation is the first step of archival integrity."</p>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 bg-surface-high border border-outline/15 flex flex-col overflow-hidden ghost-border">
          {/* Terminal Header */}
          <div className="h-10 bg-surface border-b border-outline/10 flex items-center px-6 justify-between">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
              <div className="w-2 h-2 rounded-full bg-primary/50"></div>
            </div>
            <span className="text-[9px] font-mono text-secondary/40 uppercase tracking-widest">holonet-terminal-v1.0.42</span>
          </div>
          
          {/* Terminal Body */}
          <div className="flex-1 overflow-y-auto p-8 font-mono text-xs leading-relaxed custom-scrollbar bg-[#050505]">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-6 group hover:bg-white/5 transition-colors py-0.5">
                <span className="text-secondary/20 w-8 select-none text-right">{i + 1}</span>
                <p className={`flex-1 break-all ${log.toLowerCase().includes('error') ? 'text-red-400' : log.toLowerCase().includes('warn') ? 'text-yellow-400' : 'text-secondary/80'}`}>
                  {log}
                </p>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
          
          {/* Terminal Footer */}
          <div className="h-12 bg-surface border-t border-outline/10 flex items-center px-8 justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-primary animate-pulse">●</span>
              <span className="text-[10px] text-secondary uppercase tracking-widest">Streaming live telemetry</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-secondary/40 uppercase tracking-widest">Lines</span>
                <span className="text-[10px] text-on-surface font-mono">{logs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-secondary/40 uppercase tracking-widest">Status</span>
                <span className={`text-[10px] font-mono ${status === 'success' ? 'text-primary' : status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentLogPage;
