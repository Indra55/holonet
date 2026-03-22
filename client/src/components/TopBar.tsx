import React from 'react';
import { Search, Bell, HelpCircle } from 'lucide-react';

interface TopBarProps {
  title: string;
  breadcrumbs?: string[];
}

const TopBar: React.FC<TopBarProps> = ({ title, breadcrumbs }) => {
  return (
    <header className="flex justify-between items-center w-full px-12 h-20 sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-outline/15">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-serif text-on-surface">{title}</h2>
        {breadcrumbs && breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className="text-outline/40 font-light">/</span>
            <span className="font-sans text-xs uppercase tracking-widest text-secondary">{crumb}</span>
          </React.Fragment>
        ))}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" size={16} />
          <input 
            className="bg-transparent border-none text-[10px] font-sans tracking-widest pl-10 focus:ring-0 placeholder:text-secondary/30 w-48 uppercase" 
            placeholder="QUERY SYSTEM..." 
            type="text" 
          />
        </div>
        
        <div className="flex items-center gap-4">
          <button className="text-secondary hover:text-primary transition-all opacity-80 hover:opacity-100">
            <Bell size={20} />
          </button>
          <button className="text-secondary hover:text-primary transition-all opacity-80 hover:opacity-100">
            <HelpCircle size={20} />
          </button>
          <button className="bg-primary px-6 py-2 text-[10px] font-sans uppercase tracking-widest hover:bg-primary-container transition-all text-white font-bold">
            Deploy
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
