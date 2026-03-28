import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewServicePage from './pages/NewServicePage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import DeploymentLogPage from './pages/DeploymentLogPage';
import DocsPage from './pages/DocsPage';
import ApiDocsPage from './pages/ApiDocsPage';

import LandingPage from './pages/LandingPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/api/docs" element={<ApiDocsPage />} />
          
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/services" element={<Navigate to="/dashboard" replace />} />
            <Route path="/services/new" element={<NewServicePage />} />
            <Route path="/services/:id" element={<ServiceDetailPage />} />
            <Route path="/services/:id/deployments/:deploymentId" element={<DeploymentLogPage />} />
            
            {/* Placeholder for other routes */}
            <Route path="/logs" element={<div className="p-12 text-secondary italic serif-display">Logs Archive coming soon...</div>} />
            <Route path="/settings" element={<div className="p-12 text-secondary italic serif-display">System Settings coming soon...</div>} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
