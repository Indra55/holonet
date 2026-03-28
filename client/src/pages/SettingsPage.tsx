import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Terminal, Save } from 'lucide-react';
import TopBar from '../components/TopBar';
import { useAuth } from '../hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile');
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    notifications: {
      deployments: true,
      failures: true,
      updates: false
    },
    appearance: {
      theme: 'dark' as const,
      animations: true,
      compact: false
    }
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ] as const;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A]">
      <TopBar title="System Settings" breadcrumbs={['Configuration']} />
      
      <div className="p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h2 className="text-4xl font-serif mb-2 text-white">System Settings</h2>
            <p className="text-[#94A3B8] text-sm">Manage your account and application preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#D95D39]/10 border border-[#D95D39]/30 text-[#D95D39]'
                          : 'text-[#94A3B8] hover:text-white hover:bg-[#121212]'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-[#121212] border border-[#1E293B]/15 rounded-lg p-8">
                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-serif mb-6 text-white">Profile Information</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-sans uppercase tracking-widest text-[#94A3B8] mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full bg-[#0A0A0A] border border-[#1E293B]/30 rounded-lg px-4 py-3 text-white focus:border-[#D95D39] focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-sans uppercase tracking-widest text-[#94A3B8] mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-[#0A0A0A] border border-[#1E293B]/30 rounded-lg px-4 py-3 text-white focus:border-[#D95D39] focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-sans uppercase tracking-widest text-[#94A3B8] mb-2">
                            GitHub Username
                          </label>
                          <input
                            type="text"
                            value={user?.github_username || ''}
                            disabled
                            className="w-full bg-[#1A1A1A] border border-[#1E293B]/20 rounded-lg px-4 py-3 text-[#94A3B8] cursor-not-allowed"
                          />
                          <p className="text-xs text-[#94A3B8]/60 mt-1">Connected via GitHub OAuth</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-serif mb-6 text-white">Notification Preferences</h3>
                      
                      <div className="space-y-4">
                        {Object.entries({
                          deployments: 'Deployment notifications',
                          failures: 'Deployment failure alerts', 
                          updates: 'System updates and announcements'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between py-3">
                            <div>
                              <div className="text-white font-medium">{label}</div>
                              <div className="text-sm text-[#94A3B8]">
                                {key === 'deployments' && 'Get notified when deployments complete'}
                                {key === 'failures' && 'Immediate alerts for deployment failures'}
                                {key === 'updates' && 'News about platform updates'}
                              </div>
                            </div>
                            <button
                              onClick={() => setFormData({
                                ...formData,
                                notifications: {
                                  ...formData.notifications,
                                  [key]: !formData.notifications[key as keyof typeof formData.notifications]
                                }
                              })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                formData.notifications[key as keyof typeof formData.notifications]
                                  ? 'bg-[#D95D39]'
                                  : 'bg-[#1E293B]'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  formData.notifications[key as keyof typeof formData.notifications]
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-serif mb-6 text-white">Security Settings</h3>
                      
                      <div className="space-y-6">
                        <div className="bg-[#0A0A0A] border border-[#1E293B]/20 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Shield size={20} className="text-[#D95D39]" />
                            <h4 className="text-white font-semibold">GitHub Authentication</h4>
                          </div>
                          <p className="text-[#94A3B8] text-sm mb-4">
                            Your account is secured via GitHub OAuth. You can revoke access anytime from your GitHub settings.
                          </p>
                          <button className="text-sm text-[#D95D39] hover:underline">
                            Manage GitHub permissions →
                          </button>
                        </div>
                        
                        <div className="bg-[#0A0A0A] border border-[#1E293B]/20 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <Terminal size={20} className="text-[#D95D39]" />
                            <h4 className="text-white font-semibold">API Tokens</h4>
                          </div>
                          <p className="text-[#94A3B8] text-sm mb-4">
                            Generate API tokens for programmatic access to your deployments.
                          </p>
                          <button className="text-sm text-[#D95D39] hover:underline">
                            Generate new token →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-serif mb-6 text-white">Appearance</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-sans uppercase tracking-widest text-[#94A3B8] mb-3">
                            Theme
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {(['dark', 'light'] as const).map((theme) => (
                              <button
                                key={theme}
                                onClick={() => setFormData({
                                  ...formData,
                                  appearance: { ...formData.appearance, theme }
                                })}
                                className={`p-4 border rounded-lg transition-all ${
                                  formData.appearance.theme === theme
                                    ? 'border-[#D95D39] bg-[#D95D39]/10 text-[#D95D39]'
                                    : 'border-[#1E293B]/30 text-[#94A3B8] hover:border-[#94A3B8]/50'
                                }`}
                              >
                                <div className="font-medium capitalize">{theme}</div>
                                <div className="text-xs opacity-75">
                                  {theme === 'dark' ? 'Default dark theme' : 'Light theme'}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {Object.entries({
                            animations: 'Enable animations and transitions',
                            compact: 'Compact interface layout'
                          }).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between py-3">
                              <div>
                                <div className="text-white font-medium">{label}</div>
                              </div>
                              <button
                                onClick={() => setFormData({
                                  ...formData,
                                  appearance: {
                                    ...formData.appearance,
                                    [key]: !formData.appearance[key as keyof typeof formData.appearance]
                                  }
                                })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  formData.appearance[key as keyof typeof formData.appearance]
                                    ? 'bg-[#D95D39]'
                                    : 'bg-[#1E293B]'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    formData.appearance[key as keyof typeof formData.appearance]
                                      ? 'translate-x-6'
                                      : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-12 pt-8 border-t border-[#1E293B]/20">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#D95D39] text-white px-8 py-3 text-sm font-sans uppercase tracking-widest hover:bg-[#ea6944] transition-all flex items-center gap-2 font-bold disabled:opacity-50"
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
