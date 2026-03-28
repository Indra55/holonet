import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ApiDocsPage: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string>('auth');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const endpoints = {
    auth: {
      title: 'Authentication',
      description: 'User authentication and session management endpoints',
      endpoints: [
        {
          method: 'GET',
          path: '/api/auth/github',
          description: 'Initiate GitHub OAuth flow',
          params: [
            { name: 'join_code', type: 'query', required: false, description: 'Team invitation code' }
          ],
          response: 'Redirects to GitHub OAuth page'
        },
        {
          method: 'GET',
          path: '/api/auth/github/callback',
          description: 'GitHub OAuth callback handler',
          params: [],
          response: 'Redirects to frontend with authentication cookies'
        },
        {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register new user account',
          params: [
            { name: 'username', type: 'body', required: true, description: '3-30 chars, alphanumeric + underscore' },
            { name: 'email', type: 'body', required: true, description: 'Valid email format' },
            { name: 'password', type: 'body', required: true, description: 'Minimum 8 characters' }
          ],
          response: `{ success: true, data: { id, username, email, created_at } }`
        },
        {
          method: 'POST',
          path: '/api/auth/login',
          description: 'User login with email and password',
          params: [
            { name: 'email', type: 'body', required: true, description: 'User email' },
            { name: 'password', type: 'body', required: true, description: 'User password' }
          ],
          response: `{ success: true, data: { id, username, email, github_username? } }`
        },
        {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Get current authenticated user',
          params: [],
          auth: true,
          response: `{ success: true, data: { id, username, email, github_username?, github_user_id?, created_at } }`
        },
        {
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Logout user and clear session',
          params: [],
          auth: true,
          response: `{ success: true, message: "Logged out successfully" }`
        }
      ]
    },
    services: {
      title: 'Services',
      description: 'Service management and deployment endpoints',
      endpoints: [
        {
          method: 'POST',
          path: '/api/services/create_service',
          description: 'Create new deployment service',
          auth: true,
          params: [
            { name: 'name', type: 'body', required: true, description: 'Service display name' },
            { name: 'repo_url', type: 'body', required: true, description: 'Git repository URL' },
            { name: 'runtime', type: 'body', required: true, description: '"node" | "python" | "go" | "static"' },
            { name: 'branch', type: 'body', required: false, description: 'Default: "main"' },
            { name: 'root_directory', type: 'body', required: false, description: 'Default: "/"' },
            { name: 'subdomain', type: 'body', required: true, description: '3-63 chars, lowercase alphanumeric + hyphens' },
            { name: 'build_cmd', type: 'body', required: false, description: 'Custom build command' },
            { name: 'start_cmd', type: 'body', required: false, description: 'Custom start command' },
            { name: 'env_vars', type: 'body', required: false, description: 'Environment variables as JSON' }
          ],
          response: `{ success: true, data: { id, name, subdomain, repo_url, runtime, status, deploy_url?, created_at } }`
        },
        {
          method: 'GET',
          path: '/api/services',
          description: 'List user services',
          auth: true,
          params: [
            { name: 'page', type: 'query', required: false, description: 'Page number (default: 1)' },
            { name: 'limit', type: 'query', required: false, description: 'Items per page (default: 10, max: 50)' },
            { name: 'status', type: 'query', required: false, description: 'Filter by status' }
          ],
          response: `{ success: true, data: { services: Service[], pagination: PaginationInfo } }`
        },
        {
          method: 'GET',
          path: '/api/services/:id',
          description: 'Get service details',
          auth: true,
          params: [
            { name: 'id', type: 'path', required: true, description: 'Service UUID' }
          ],
          response: `{ success: true, data: Service }`
        },
        {
          method: 'PUT',
          path: '/api/services/:id',
          description: 'Update service configuration',
          auth: true,
          params: [
            { name: 'id', type: 'path', required: true, description: 'Service UUID' },
            { name: 'name', type: 'body', required: false, description: 'Service display name' },
            { name: 'branch', type: 'body', required: false, description: 'Git branch' },
            { name: 'root_directory', type: 'body', required: false, description: 'Root directory' },
            { name: 'build_cmd', type: 'body', required: false, description: 'Build command' },
            { name: 'start_cmd', type: 'body', required: false, description: 'Start command' },
            { name: 'env_vars', type: 'body', required: false, description: 'Environment variables' }
          ],
          response: `{ success: true, data: Service }`
        },
        {
          method: 'DELETE',
          path: '/api/services/:id',
          description: 'Delete service and all deployments',
          auth: true,
          params: [
            { name: 'id', type: 'path', required: true, description: 'Service UUID' }
          ],
          response: `{ success: true, message: "Service deleted successfully" }`
        },
        {
          method: 'POST',
          path: '/api/services/:id/deploy',
          description: 'Trigger manual deployment',
          auth: true,
          params: [
            { name: 'id', type: 'path', required: true, description: 'Service UUID' }
          ],
          response: `{ success: true, data: { deployment_id, status: "queued", message } }`
        },
        {
          method: 'GET',
          path: '/api/services/:id/deployments',
          description: 'Get deployment history',
          auth: true,
          params: [
            { name: 'id', type: 'path', required: true, description: 'Service UUID' },
            { name: 'page', type: 'query', required: false, description: 'Page number' },
            { name: 'limit', type: 'query', required: false, description: 'Items per page' },
            { name: 'status', type: 'query', required: false, description: 'Filter by status' }
          ],
          response: `{ success: true, data: { deployments: Deployment[], pagination: PaginationInfo } }`
        }
      ]
    },
    webhooks: {
      title: 'Webhooks',
      description: 'Webhook handlers for Git integration',
      endpoints: [
        {
          method: 'POST',
          path: '/api/webhooks/github',
          description: 'GitHub webhook handler',
          params: [],
          response: `{ success: true, message: "Webhook processed successfully" }`,
          notes: 'Uses webhook signature verification for security'
        }
      ]
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-neutral-200 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap');

        .font-headline { font-family: 'Noto Serif', serif !important; }
        .font-body { font-family: 'Inter', sans-serif !important; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .burn-gradient { background-image: linear-gradient(135deg, #D95D39 0%, #ea6944 100%); }
        
        ::selection { background-color: rgba(217, 93, 57, 0.3); color: white; }
        
        .method-get { background: #10B981; }
        .method-post { background: #3B82F6; }
        .method-put { background: #F59E0B; }
        .method-delete { background: #EF4444; }
        
        .endpoint-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(217, 93, 57, 0.2); }
      `}} />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-neutral-900"
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl text-[#D95D39] font-bold">∞</span>
              <h1 className="font-headline text-xl tracking-[0.2em] uppercase text-[#D95D39]">API DOCS</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="/docs" className="text-neutral-400 hover:text-[#D95D39] transition-colors text-sm">← Back to Docs</a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative py-16 px-6 border-b border-neutral-900">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto"
        >
          <motion.div variants={itemVariants}>
            <h1 className="font-headline text-5xl md:text-6xl mb-6">
              <span className="text-transparent bg-clip-text burn-gradient [background-clip:text] [-webkit-background-clip:text]">
                API Documentation
              </span>
            </h1>
            <p className="font-body text-xl text-neutral-400 max-w-3xl leading-relaxed">
              Complete RESTful API reference for HOLONET deployment platform. Authentication, service management, deployments, and webhooks.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Base URL */}
      <section className="py-8 px-6 bg-[#121212] border-b border-neutral-900">
        <div className="max-w-screen-2xl mx-auto">
          <h3 className="font-headline text-lg text-neutral-100 mb-3">Base URL</h3>
          <div className="bg-[#1E293B] p-4 rounded-lg">
            <code className="text-[#D95D39] font-mono">
              Production: https://holonet.hitanshu.xyz<br/>
              Development: http://localhost:3000
            </code>
          </div>
        </div>
      </section>

      {/* Authentication Info */}
      <section className="py-8 px-6 bg-[#0A0A0A] border-b border-neutral-900">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto"
        >
          <h2 className="font-headline text-2xl text-neutral-100 mb-6">Authentication</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={itemVariants} className="bg-[#121212] p-6 rounded-lg border border-neutral-800">
              <h3 className="font-headline text-lg text-[#D95D39] mb-3">JWT Token Authentication</h3>
              <p className="text-neutral-400 mb-4">
                Include the JWT token in the Authorization header:
              </p>
              <div className="bg-[#1E293B] p-3 rounded">
                <code className="text-sm text-neutral-300">Authorization: Bearer &lt;jwt_token&gt;</code>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-[#121212] p-6 rounded-lg border border-neutral-800">
              <h3 className="font-headline text-lg text-[#D95D39] mb-3">Session Management</h3>
              <ul className="text-neutral-400 space-y-2">
                <li>• Token Expiry: 7 days</li>
                <li>• Refresh: Automatic via cookies</li>
                <li>• Secure: HTTP-only cookies in production</li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Endpoint Categories */}
      <section className="py-12 px-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <motion.aside variants={itemVariants} className="lg:w-80">
              <nav className="sticky top-24 space-y-2">
                <h3 className="font-headline text-lg text-neutral-100 mb-4">Endpoint Categories</h3>
                {Object.entries(endpoints).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setActiveEndpoint(key)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      activeEndpoint === key
                        ? 'bg-[#D95D39]/20 border border-[#D95D39]/50 text-[#D95D39]'
                        : 'bg-[#121212] border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-semibold">{category.title}</div>
                    <div className="text-sm opacity-75">{category.description}</div>
                  </button>
                ))}
              </nav>
            </motion.aside>

            {/* Endpoint Details */}
            <motion.main variants={itemVariants} className="flex-1">
              <div className="space-y-8">
                {endpoints[activeEndpoint as keyof typeof endpoints].endpoints.map((endpoint, idx) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    className="endpoint-card bg-[#121212] border border-neutral-800 rounded-lg overflow-hidden transition-all duration-300"
                  >
                    <div className="p-6">
                      {/* Method and Path */}
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`method-${endpoint.method.toLowerCase()} text-white px-3 py-1 rounded text-sm font-bold uppercase`}>
                          {endpoint.method}
                        </span>
                        <code className="text-[#D95D39] font-mono text-lg">{endpoint.path}</code>
                        {endpoint.auth && (
                          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
                            🔒 AUTH REQUIRED
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-neutral-400 mb-6">{endpoint.description}</p>

                      {/* Parameters */}
                      {endpoint.params.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-headline text-lg text-neutral-100 mb-3">Parameters</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-neutral-700">
                                  <th className="text-left py-2 px-3 text-neutral-300">Name</th>
                                  <th className="text-left py-2 px-3 text-neutral-300">Type</th>
                                  <th className="text-left py-2 px-3 text-neutral-300">Required</th>
                                  <th className="text-left py-2 px-3 text-neutral-300">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {endpoint.params.map((param, paramIdx) => (
                                  <tr key={paramIdx} className="border-b border-neutral-800">
                                    <td className="py-2 px-3 font-mono text-[#D95D39]">{param.name}</td>
                                    <td className="py-2 px-3 text-neutral-400">{param.type}</td>
                                    <td className="py-2 px-3">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        param.required 
                                          ? 'bg-red-500/20 text-red-400' 
                                          : 'bg-neutral-700 text-neutral-400'
                                      }`}>
                                        {param.required ? 'YES' : 'NO'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 text-neutral-400">{param.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Response */}
                      <div>
                        <h4 className="font-headline text-lg text-neutral-100 mb-3">Response</h4>
                        <div className="bg-[#1E293B] p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm text-neutral-300 font-mono">
                            {endpoint.response}
                          </pre>
                        </div>
                      </div>

                      {/* Notes */}
                      {endpoint.notes && (
                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                          <p className="text-blue-400 text-sm">
                            <strong>Note:</strong> {endpoint.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.main>
          </div>
        </motion.div>
      </section>

      {/* Data Types */}
      <section className="py-12 px-6 bg-[#121212] border-t border-neutral-900">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto"
        >
          <h2 className="font-headline text-3xl text-neutral-100 mb-8">Data Types</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={itemVariants}>
              <h3 className="font-headline text-xl text-[#D95D39] mb-4">Service Object</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`interface Service {
  id: string;
  user_id: string;
  name: string;
  subdomain: string;
  repo_url: string;
  branch: string;
  root_directory: string;
  runtime: "node" | "python" | "go" | "static";
  build_cmd?: string;
  start_cmd?: string;
  env_vars: Record<string, string>;
  status: "created" | "pending_deployment" | "deploying" | "deployed" | "failed";
  deploy_url?: string;
  github_webhook_id?: string;
  created_at: string;
  updated_at: string;
}`}
                </pre>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="font-headline text-xl text-[#D95D39] mb-4">Deployment Object</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`interface Deployment {
  id: string;
  service_id: string;
  commit_sha: string;
  commit_message?: string;
  commit_author?: string;
  branch: string;
  status: "queued" | "building" | "pushing_image" | "deploying" | "success" | "failed" | "cancelled";
  trigger_type: "webhook" | "manual" | "rollback" | "api";
  deployed_url?: string;
  build_logs?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
}`}
                </pre>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Error Handling */}
      <section className="py-12 px-6 bg-[#0A0A0A] border-t border-neutral-900">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto"
        >
          <h2 className="font-headline text-3xl text-neutral-100 mb-8">Error Handling</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={itemVariants}>
              <h3 className="font-headline text-xl text-[#D95D39] mb-4">Error Response Format</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`{
  success: false,
  error: string;
  code?: string;
  details?: any;
}`}
                </pre>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <h3 className="font-headline text-xl text-[#D95D39] mb-4">HTTP Status Codes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-green-400">200</span>
                  <span className="text-neutral-400">OK - Successful request</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-green-400">201</span>
                  <span className="text-neutral-400">Created - Resource created</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-yellow-400">400</span>
                  <span className="text-neutral-400">Bad Request - Invalid input data</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-yellow-400">401</span>
                  <span className="text-neutral-400">Unauthorized - Missing or invalid token</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-yellow-400">404</span>
                  <span className="text-neutral-400">Not Found - Resource not found</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-800">
                  <span className="text-red-400">500</span>
                  <span className="text-neutral-400">Internal Server Error</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default ApiDocsPage;
