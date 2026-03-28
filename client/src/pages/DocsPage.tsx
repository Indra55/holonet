import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DocsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle smooth scrolling with offset for sticky header
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerHeight = 80; // Height of sticky header
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  // Handle logo click - navigate based on auth status
  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="bg-[#0A0A0A] text-neutral-200 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');

        .font-headline { font-family: 'Inter', sans-serif !important; font-weight: 600; }
        .font-body { font-family: 'Inter', sans-serif !important; font-weight: 400; }
        .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .burn-gradient { background-image: linear-gradient(135deg, #D95D39 0%, #ea6944 100%); }
        .grid-pattern { background-image: radial-gradient(circle, #333 1px, transparent 1px); background-size: 40px 40px; opacity: 0.15; }
        
        ::selection { background-color: rgba(217, 93, 57, 0.3); color: white; }
        
        /* Clean Typography */
        .prose h1 { @apply font-headline text-3xl md:text-4xl text-neutral-100 mb-6 leading-tight; }
        .prose h2 { @apply font-headline text-2xl md:text-3xl text-neutral-100 mb-8 mt-16 leading-tight; }
        .prose h3 { @apply font-headline text-xl md:text-2xl text-neutral-100 mb-6 mt-12 leading-tight; }
        .prose h4 { @apply font-headline text-lg text-neutral-200 mb-4 mt-8 leading-tight; }
        .prose p { @apply font-body text-neutral-300 leading-relaxed mb-6 text-base; }
        .prose ul { @apply font-body text-neutral-300 space-y-2 mb-6 text-base; }
        .prose ol { @apply font-body text-neutral-300 space-y-2 mb-6 text-base; }
        .prose li { @apply leading-relaxed; }
        .prose li::marker { @apply text-[#D95D39]; }
        .prose code { @apply bg-[#1E293B] text-[#F97316] px-2 py-1 rounded font-mono text-sm; }
        .prose pre { @apply bg-[#0F172A] border border-[#1E293B] p-4 rounded-lg overflow-x-auto mb-6; }
        .prose pre code { @apply bg-transparent text-neutral-300 p-0; }
        .prose a { @apply text-[#FB923C] hover:text-[#F97316] transition-colors; }
        .prose strong { @apply text-neutral-100 font-semibold; }
        .prose blockquote { @apply border-l-4 border-[#D95D39] pl-6 text-neutral-300 mb-6; }
      `}} />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-2xl border-b border-neutral-900"
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleLogoClick}
              className="flex items-center gap-3 text-neutral-400 hover:text-[#D95D39] transition-colors cursor-pointer group"
            >
              <span className="text-2xl text-[#D95D39] font-bold group-hover:scale-110 transition-transform">∞</span>
              <h1 className="font-headline text-xl tracking-[0.2em] uppercase text-[#D95D39]">HOLONET</h1>
            </button>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#overview" onClick={(e) => handleScroll(e, 'overview')} className="text-neutral-400 hover:text-[#D95D39] transition-colors text-sm cursor-pointer">Overview</a>
              <a href="#architecture" onClick={(e) => handleScroll(e, 'architecture')} className="text-neutral-400 hover:text-[#D95D39] transition-colors text-sm cursor-pointer">Architecture</a>
              <a href="#features" onClick={(e) => handleScroll(e, 'core-features')} className="text-neutral-400 hover:text-[#D95D39] transition-colors text-sm cursor-pointer">Features</a>
              <a href="#setup" onClick={(e) => handleScroll(e, 'development-setup')} className="text-neutral-400 hover:text-[#D95D39] transition-colors text-sm cursor-pointer">Setup</a>
            </nav>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none"></div>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-screen-2xl mx-auto relative z-10"
        >
          <motion.div variants={itemVariants} className="text-center mb-16">
            <h1 className="font-headline text-6xl md:text-7xl lg:text-8xl leading-tight mb-8">
              <span className="text-transparent bg-clip-text burn-gradient [background-clip:text] [-webkit-background-clip:text]">
                HOLONET
              </span>
            </h1>
            <p className="font-body text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Self-hosted deployment platform with Vercel-like experience. Deploy from Git, containerize automatically, and scale on your infrastructure.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Documentation Content */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-6 pb-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Table of Contents - Sidebar */}
          <motion.aside variants={itemVariants} className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
            <nav className="space-y-2">
              <h3 className="font-headline text-lg text-neutral-100 mb-4">Table of Contents</h3>
              {[
                { href: '#overview', title: 'Overview' },
                { href: '#architecture', title: 'Architecture' },
                { href: '#technology-stack', title: 'Technology Stack' },
                { href: '#database-schema', title: 'Database Schema' },
                { href: '#core-features', title: 'Core Features' },
                { href: '#api-endpoints', title: 'API Endpoints' },
                { href: '#environment-variables', title: 'Environment Variables' },
                { href: '#development-setup', title: 'Development Setup' },
                { href: '#production-deployment', title: 'Production Deployment' },
                { href: '#security-considerations', title: 'Security' },
                { href: '#monitoring', title: 'Monitoring' },
                { href: '#troubleshooting', title: 'Troubleshooting' }
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleScroll(e, item.href.substring(1))}
                  className="block text-neutral-400 hover:text-[#D95D39] transition-colors py-1 text-sm cursor-pointer"
                >
                  {item.title}
                </a>
              ))}
            </nav>
          </motion.aside>

          {/* Main Content */}
          <motion.main variants={itemVariants} className="lg:col-span-9">
            <div className="prose prose-invert max-w-none">
              <section id="overview" className="mb-16">
                <h2>Overview</h2>
                <p>
                  HOLONET is a self-hosted deployment platform designed to provide developers with a Vercel-like experience on bare-metal infrastructure. The platform automates the deployment of web applications through Git-based workflows, containerization, and intelligent load balancing.
                </p>
              </section>

              <section id="architecture" className="mb-16">
                <h2>Architecture</h2>
                <div className="bg-[#1E293B]/20 border border-[#334155] rounded-xl p-8 mb-8">
                  <div className="text-center text-neutral-400">
                    <div className="mb-4">
                      <span className="text-4xl">🏗️</span>
                    </div>
                    <p className="text-sm">Architecture Diagram</p>
                    <p className="text-xs text-neutral-500 mt-2">Add your architecture image here</p>
                  </div>
                </div>
              </section>

              <section id="technology-stack" className="mb-16">
                <h2>Technology Stack</h2>
                
                <h3>Backend</h3>
                <ul>
                  <li><strong>Runtime:</strong> Bun (JavaScript/TypeScript)</li>
                  <li><strong>Framework:</strong> Express.js</li>
                  <li><strong>Database:</strong> PostgreSQL with UUIDv7 primary keys</li>
                  <li><strong>Queue System:</strong> BullMQ with Redis</li>
                  <li><strong>Authentication:</strong> JWT + Passport.js (GitHub OAuth)</li>
                  <li><strong>Containerization:</strong> Docker</li>
                  <li><strong>Reverse Proxy:</strong> Nginx</li>
                </ul>
              <ul>
                <li><strong>Runtime:</strong> Bun (JavaScript/TypeScript)</li>
                <li><strong>Framework:</strong> Express.js</li>
                <li><strong>Database:</strong> PostgreSQL with UUIDv7 primary keys</li>
                <li><strong>Queue System:</strong> BullMQ with Redis</li>
                <li><strong>Authentication:</strong> JWT + Passport.js (GitHub OAuth)</li>
                <li><strong>Containerization:</strong> Docker</li>
                <li><strong>Reverse Proxy:</strong> Nginx</li>
              </ul>

              <h3>Frontend</h3>
              <ul>
                <li><strong>Framework:</strong> React 19</li>
                <li><strong>Routing:</strong> React Router DOM</li>
                <li><strong>Styling:</strong> TailwindCSS v4</li>
                <li><strong>Animations:</strong> Framer Motion</li>
                <li><strong>Icons:</strong> Lucide React</li>
                <li><strong>Build Tool:</strong> Vite</li>
              </ul>

              <h3>Infrastructure</h3>
              <ul>
                <li><strong>Deployment:</strong> Docker containers on bare-metal</li>
                <li><strong>Load Balancing:</strong> Nginx with dynamic configuration</li>
                <li><strong>Process Management:</strong> Systemd services</li>
                <li><strong>Monitoring:</strong> Custom health endpoints</li>
              </ul>
            </section>

            <section id="database-schema" className="mb-16">
              <h2>Database Schema</h2>
              <div className="bg-[#1E293B]/20 border border-[#334155] rounded-xl p-8 mb-8">
                <div className="text-center text-neutral-400">
                  <div className="mb-4">
                    <span className="text-4xl">🗄️</span>
                  </div>
                  <p className="text-sm">Database Schema Diagram</p>
                  <p className="text-xs text-neutral-500 mt-2">Add your database schema image here</p>
                </div>
              </div>
            </section>

            <section id="core-features" className="mb-16">
              <h2>Core Features</h2>
              
              <h3>1. Authentication & Authorization</h3>
              <ul>
                <li>GitHub OAuth integration</li>
                <li>JWT-based session management</li>
                <li>Secure cookie handling</li>
                <li>User profile management</li>
              </ul>

              <h3>2. Service Management</h3>
              <ul>
                <li>Git repository integration (GitHub, GitLab, Bitbucket)</li>
                <li>Multi-runtime support (Node.js, Python, Go, Static)</li>
                <li>Custom build and start commands</li>
                <li>Environment variable management</li>
                <li>Subdomain allocation</li>
              </ul>

              <h3>3. Deployment Pipeline</h3>
              <div className="bg-[#1E293B]/20 border border-[#334155] rounded-xl p-8 mb-8">
                <div className="text-center text-neutral-400">
                  <div className="mb-4">
                    <span className="text-4xl">🚀</span>
                  </div>
                  <p className="text-sm">Deployment Pipeline Diagram</p>
                  <p className="text-xs text-neutral-500 mt-2">Add your deployment pipeline image here</p>
                </div>
              </div>

              <h3>4. Container Orchestration</h3>
              <ul>
                <li>Docker-based containerization</li>
                <li>Automatic port allocation</li>
                <li>Resource monitoring</li>
                <li>Graceful shutdown handling</li>
                <li>Log aggregation</li>
              </ul>

              <h3>5. Load Balancing</h3>
              <ul>
                <li>Dynamic Nginx configuration</li>
                <li>SSL/TLS termination</li>
                <li>Path-based routing</li>
                <li>Health checks</li>
                <li>Automatic failover</li>
              </ul>
            </section>

            <section id="api-endpoints" className="mb-16">
              <h2>API Endpoints</h2>
              
              <h3>Authentication</h3>
              <ul>
                <li><code>GET /api/auth/github</code> - Initiate GitHub OAuth</li>
                <li><code>GET /api/auth/github/callback</code> - OAuth callback</li>
                <li><code>POST /api/auth/register</code> - User registration</li>
                <li><code>POST /api/auth/login</code> - User login</li>
                <li><code>GET /api/auth/me</code> - Get current user</li>
                <li><code>POST /api/auth/logout</code> - Logout</li>
              </ul>

              <h3>Services</h3>
              <ul>
                <li><code>POST /api/services/create_service</code> - Create new service</li>
                <li><code>GET /api/services</code> - List user services</li>
                <li><code>GET /api/services/:id</code> - Get service details</li>
                <li><code>PUT /api/services/:id</code> - Update service</li>
                <li><code>DELETE /api/services/:id</code> - Delete service</li>
                <li><code>POST /api/services/:id/deploy</code> - Manual deployment</li>
                <li><code>GET /api/services/:id/deployments</code> - Deployment history</li>
              </ul>

              <h3>Webhooks</h3>
              <ul>
                <li><code>POST /api/webhooks/github</code> - GitHub webhook handler</li>
              </ul>
            </section>

            <section id="environment-variables" className="mb-16">
              <h2>Environment Variables</h2>
              
              <h3>Server Configuration</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`# Core
PORT=3000
NODE_ENV=production
BASE_URL=https://holonet.example.com

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/holonet

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Webhooks
WEBHOOK_SECRET=your-webhook-secret

# CORS
CORS_ORIGIN=https://holonet.example.com`}
                </pre>
              </div>

              <h3>Client Configuration</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`VITE_API_BASE_URL=https://api.holonet.example.com
VITE_GITHUB_CLIENT_ID=your-github-client-id`}
                </pre>
              </div>
            </section>

            <section id="development-setup" className="mb-16">
              <h2>Development Setup</h2>
              
              <h3>Prerequisites</h3>
              <ul>
                <li>Node.js 18+</li>
                <li>PostgreSQL 14+</li>
                <li>Redis 6+</li>
                <li>Docker & Docker Compose</li>
                <li>Bun runtime</li>
              </ul>

              <h3>Local Development</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`# Clone repository
git clone https://github.com/indra55/holonet.git
cd holonet

# Install dependencies
cd server && bun install
cd ../client && npm install

# Setup database
createdb holonet
psql holonet < server/schema.sql

# Start services
redis-server
bun run dev  # Server
npm run dev   # Client`}
                </pre>
              </div>
            </section>

            <section id="production-deployment" className="mb-16">
              <h2>Production Deployment</h2>
              
              <h3>System Requirements</h3>
              <ul>
                <li><strong>CPU:</strong> 4+ cores</li>
                <li><strong>RAM:</strong> 8GB+ minimum</li>
                <li><strong>Storage:</strong> 100GB+ SSD</li>
                <li><strong>OS:</strong> Ubuntu 20.04+ or CentOS 8+</li>
              </ul>

              <h3>Deployment Steps</h3>
              <ol>
                <li><strong>Provision Infrastructure</strong>
                  <ul>
                    <li>Set up bare-metal server</li>
                    <li>Install Docker and dependencies</li>
                    <li>Configure firewall and networking</li>
                  </ul>
                </li>
                <li><strong>Database Setup</strong>
                  <ul>
                    <li>Install PostgreSQL</li>
                    <li>Create database and user</li>
                    <li>Run schema migrations</li>
                  </ul>
                </li>
                <li><strong>Application Deployment</strong>
                  <ul>
                    <li>Build and deploy containers</li>
                    <li>Configure Nginx reverse proxy</li>
                    <li>Set up SSL certificates</li>
                  </ul>
                </li>
                <li><strong>Monitoring Setup</strong>
                  <ul>
                    <li>Configure logging</li>
                    <li>Set up health checks</li>
                    <li>Install monitoring tools</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section id="security-considerations" className="mb-16">
              <h2>Security Considerations</h2>
              
              <h3>Data Protection</h3>
              <ul>
                <li>Password hashing with bcrypt (cost factor 12)</li>
                <li>JWT token expiration and refresh</li>
                <li>Secure cookie configuration</li>
                <li>Environment variable encryption</li>
              </ul>

              <h3>Network Security</h3>
              <ul>
                <li>Container isolation</li>
                <li>Network segmentation</li>
                <li>Firewall rules</li>
                <li>SSL/TLS enforcement</li>
              </ul>

              <h3>Code Security</h3>
              <ul>
                <li>Input validation and sanitization</li>
                <li>SQL injection prevention</li>
                <li>XSS protection</li>
                <li>CSRF protection</li>
              </ul>
            </section>

            <section id="monitoring" className="mb-16">
              <h2>Monitoring & Observability</h2>
              
              <h3>Health Checks</h3>
              <ul>
                <li>Application health endpoint (<code>/health</code>)</li>
                <li>Database connectivity</li>
                <li>Redis queue status</li>
                <li>Container health monitoring</li>
              </ul>

              <h3>Logging</h3>
              <ul>
                <li>Structured logging with JSON format</li>
                <li>Log levels (DEBUG, INFO, WARN, ERROR)</li>
                <li>Request/response logging</li>
                <li>Error tracking</li>
              </ul>

              <h3>Metrics</h3>
              <ul>
                <li>Deployment success rate</li>
                <li>Average deployment time</li>
                <li>Container resource usage</li>
                <li>API response times</li>
              </ul>
            </section>

            <section id="troubleshooting" className="mb-16">
              <h2>Troubleshooting</h2>
              
              <h3>Common Issues</h3>
              <h4>1. Deployment Failures</h4>
              <ul>
                <li>Check build logs</li>
                <li>Verify repository access</li>
                <li>Validate runtime configuration</li>
              </ul>

              <h4>2. Container Issues</h4>
              <ul>
                <li>Resource constraints</li>
                <li>Port conflicts</li>
                <li>Network connectivity</li>
              </ul>

              <h4>3. Database Problems</h4>
              <ul>
                <li>Connection limits</li>
                <li>Query performance</li>
                <li>Disk space</li>
              </ul>

              <h3>Debug Commands</h3>
              <div className="bg-[#1E293B] p-4 rounded-lg">
                <pre className="text-sm text-neutral-300">
{`# Check service status
docker ps
docker logs <container-id>

# Monitor queue
redis-cli monitor

# Database queries
psql holonet -c "SELECT * FROM services WHERE status = 'failed';"`}
                </pre>
              </div>
            </section>
            </div>
          </motion.main>
        </div>
      </motion.div>
    </div>
  );
};

export default DocsPage;
