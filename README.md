# HOLONET

## What is HOLONET?

HOLONET is not just another deployment platform—it's a rebellion against the walled gardens of modern cloud services. Imagine having the raw power of bare-metal infrastructure combined with the developer experience of platforms like Vercel or Netlify, but without the vendor lock-in, arbitrary limits, or sky-high bills.

At its core, HOLONET is a self-hosted deployment engine that transforms your Git repositories into live applications within seconds. Push your code, and watch as it automatically gets containerized, deployed, and served through intelligent load balancing—all on infrastructure you control. Whether you're deploying Node.js apps, Python APIs, Go services, or static sites, HOLONET handles the heavy lifting while you focus on writing code.

The platform operates on a simple philosophy: **your code, your infrastructure, your rules**. No more negotiating with support teams for resource increases, no more surprise bills, and no more wondering if your data is secure. HOLONET gives you enterprise-grade deployment capabilities with the freedom that only open-source, self-hosted solutions can provide.

Built for developers who value both productivity and independence, HOLONET combines cutting-edge technologies like Docker containers, Redis-powered queues, and intelligent Nginx routing with a sleek React frontend. The result? A deployment experience that feels magical while remaining completely transparent and under your control.

This is the end of托管 dependence. This is the beginning of deployment freedom. This is HOLONET.

---

## Overview

HOLONET is a self-hosted deployment platform designed to provide developers with a Vercel-like experience on bare-metal infrastructure. The platform automates the deployment of web applications through Git-based workflows, containerization, and intelligent load balancing.

[Architecture](Image.png)

## Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend] --> B[GitHub OAuth]
        A --> C[Service Management UI]
    end
    
    subgraph "API Gateway"
        D[Express.js Server] --> E[Authentication Middleware]
        D --> F[Service Routes]
        D --> G[Webhook Handlers]
    end
    
    subgraph "Core Services"
        H[Deployment Queue] --> I[BullMQ + Redis]
        J[Container Builder] --> K[Docker Runtime]
        L[Nginx Proxy] --> M[Load Balancer]
    end
    
    subgraph "Data Layer"
        N[PostgreSQL] --> O[User Data]
        N --> P[Service Config]
        N --> Q[Deployment History]
    end
    
    subgraph "External Services"
        R[GitHub API] --> S[Webhook Integration]
        T[Git Repositories] --> U[Code Source]
    end
    
    A --> D
    D --> H
    H --> J
    J --> L
    D --> N
    S --> D
    U --> J
```

## Technology Stack

### Backend
- **Runtime**: Bun (JavaScript/TypeScript)
- **Framework**: Express.js
- **Database**: PostgreSQL with UUIDv7 primary keys
- **Queue System**: BullMQ with Redis
- **Authentication**: JWT + Passport.js (GitHub OAuth)
- **Containerization**: Docker
- **Reverse Proxy**: Nginx

### Frontend
- **Framework**: React 19
- **Routing**: React Router DOM
- **Styling**: TailwindCSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite

### Infrastructure
- **Deployment**: Docker containers on bare-metal
- **Load Balancing**: Nginx with dynamic configuration
- **Process Management**: Systemd services
- **Monitoring**: Custom health endpoints

## Database Schema

```mermaid
erDiagram
    users ||--o{ services : owns
    services ||--o{ deployments : has
    
    users {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar password
        text github_access_token
        varchar github_username
        varchar github_user_id
        timestamp created_at
        timestamp updated_at
    }
    
    services {
        uuid id PK
        uuid user_id FK
        varchar name
        varchar subdomain UK
        varchar repo_url
        varchar branch
        varchar root_directory
        varchar runtime
        text build_cmd
        text start_cmd
        jsonb env_vars
        varchar status
        text deploy_url
        varchar github_webhook_id
        timestamp created_at
        timestamp updated_at
    }
    
    deployments {
        uuid id PK
        uuid service_id FK
        varchar commit_sha
        text commit_message
        varchar commit_author
        varchar branch
        varchar status
        varchar trigger_type
        text deployed_url
        text build_logs
        text error_message
        timestamp created_at
        timestamp started_at
        timestamp completed_at
        integer duration_seconds
    }
```

## Core Features

### 1. **Authentication & Authorization**
- GitHub OAuth integration
- JWT-based session management
- Secure cookie handling
- User profile management

### 2. **Service Management**
- Git repository integration (GitHub, GitLab, Bitbucket)
- Multi-runtime support (Node.js, Python, Go, Static)
- Custom build and start commands
- Environment variable management
- Subdomain allocation

### 3. **Deployment Pipeline**
```mermaid
flowchart LR
    A[Git Push] --> B[Webhook Trigger]
    B --> C[Queue Deployment]
    C --> D[Clone Repository]
    D --> E[Build Container]
    E --> F[Run Tests]
    F --> G[Push to Registry]
    G --> H[Update Nginx Config]
    H --> I[Deploy Container]
    I --> J[Health Check]
    J --> K[Update Status]
```

### 4. **Container Orchestration**
- Docker-based containerization
- Automatic port allocation
- Resource monitoring
- Graceful shutdown handling
- Log aggregation

### 5. **Load Balancing**
- Dynamic Nginx configuration
- SSL/TLS termination
- Path-based routing
- Health checks
- Automatic failover

## API Endpoints

### Authentication
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - OAuth callback
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Services
- `POST /api/services/create_service` - Create new service
- `GET /api/services` - List user services
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/:id/deploy` - Manual deployment
- `GET /api/services/:id/deployments` - Deployment history

### Webhooks
- `POST /api/webhooks/github` - GitHub webhook handler

## Environment Variables

### Server Configuration
```bash
# Core
PORT=3000
NODE_ENV=production
BASE_URL=https://holonet.hitanshu.xyz

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
CORS_ORIGIN=https://holonet.hitanshu.xyz
```

### Client Configuration
```bash
VITE_API_BASE_URL=https://holonet.hitanshu.xyz
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

## Deployment Architecture

### Container Structure
```mermaid
graph TB
    subgraph "Host Machine"
        A[Nginx Reverse Proxy] --> B[Port 80/443]
        A --> C[Service A Container]
        A --> D[Service B Container]
        A --> E[Service N Container]
        
        F[API Server] --> G[Port 3000]
        H[Redis Queue] --> I[Port 6379]
        J[PostgreSQL] --> K[Port 5432]
    end
    
    subgraph "Docker Network"
        C --> L[holonet-network]
        D --> L
        E --> L
        F --> L
    end
```

### Service Deployment Flow
1. **Code Analysis**: Detect runtime and dependencies
2. **Container Build**: Create optimized Docker image
3. **Registry Push**: Store image in local registry
4. **Container Launch**: Deploy with resource limits
5. **Proxy Update**: Configure Nginx routing
6. **Health Monitoring**: Continuous status checks

## Security Considerations

### Data Protection
- Password hashing with bcrypt (cost factor 12)
- JWT token expiration and refresh
- Secure cookie configuration
- Environment variable encryption

### Network Security
- Container isolation
- Network segmentation
- Firewall rules
- SSL/TLS enforcement

### Code Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection

## Monitoring & Observability

### Health Checks
- Application health endpoint (`/health`)
- Database connectivity
- Redis queue status
- Container health monitoring

### Logging
- Structured logging with JSON format
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request/response logging
- Error tracking

### Metrics
- Deployment success rate
- Average deployment time
- Container resource usage
- API response times

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Bun runtime

### Local Development
```bash
# Clone repository
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
npm run dev   # Client
```

## Production Deployment

### System Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+ minimum
- **Storage**: 100GB+ SSD
- **OS**: Ubuntu 20.04+ or CentOS 8+

### Deployment Steps
1. **Provision Infrastructure**
   - Set up bare-metal server
   - Install Docker and dependencies
   - Configure firewall and networking

2. **Database Setup**
   - Install PostgreSQL
   - Create database and user
   - Run schema migrations

3. **Application Deployment**
   - Build and deploy containers
   - Configure Nginx reverse proxy
   - Set up SSL certificates

4. **Monitoring Setup**
   - Configure logging
   - Set up health checks
   - Install monitoring tools

## Performance Optimizations

### Database
- Indexed queries for common operations
- Connection pooling
- Query optimization
- Read replicas for scaling

### Application
- Redis caching for frequent queries
- Queue-based async processing
- Container resource limits
- Nginx caching rules

### Network
- CDN integration
- Compression middleware
- HTTP/2 support
- Keep-alive connections

## Troubleshooting

### Common Issues
1. **Deployment Failures**
   - Check build logs
   - Verify repository access
   - Validate runtime configuration

2. **Container Issues**
   - Resource constraints
   - Port conflicts
   - Network connectivity

3. **Database Problems**
   - Connection limits
   - Query performance
   - Disk space

### Debug Commands
```bash
# Check service status
docker ps
docker logs <container-id>

# Monitor queue
redis-cli monitor

# Database queries
psql holonet -c "SELECT * FROM services WHERE status = 'failed';"
```

## Contributing

### Development Workflow
1. Fork repository
2. Create feature branch
3. Implement changes
4. Add tests
5. Submit pull request to [indra55/holonet](https://github.com/indra55/holonet)

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [docs.holonet.hitanshu.xyz](https://docs.holonet.hitanshu.xyz)
- Issues: [GitHub Issues](https://github.com/indra55/holonet/issues)
- Community: [Discord Server](https://discord.gg/holonet)