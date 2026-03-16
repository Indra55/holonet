-- ============================================================================
-- HOLONET - Database Schema
-- ============================================================================
CREATE table users(
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- GitHub OAuth fields
    github_access_token TEXT,
    github_username VARCHAR(255),
    github_user_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT password_length CHECK (char_length(password) >= 8)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_github_user_id ON users(github_user_id) WHERE github_user_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================================================
-- SERVICES TABLE
-- ============================================================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Service identity
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    
    -- Repository config
    repo_url VARCHAR(500) NOT NULL,
    branch VARCHAR(255) DEFAULT 'main' NOT NULL,
    root_directory VARCHAR(255) DEFAULT '/' NOT NULL,
    
    -- Build config
    runtime VARCHAR(50) NOT NULL,
    build_cmd TEXT,
    start_cmd TEXT,
    env_vars JSONB DEFAULT '{}'::JSONB,
    
    -- Deployment status
    status VARCHAR(50) DEFAULT 'created' NOT NULL,
    deploy_url TEXT,
    
    -- GitHub webhook
    github_webhook_id VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT subdomain_length CHECK (char_length(subdomain) >= 3 AND char_length(subdomain) <= 63),
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'),
    CONSTRAINT runtime_valid CHECK (runtime IN ('node', 'python', 'go', 'static')),
    CONSTRAINT status_valid CHECK (status IN ('created', 'pending_deployment', 'deploying', 'deployed', 'failed')),
    CONSTRAINT repo_url_format CHECK (repo_url ~* '^https?://(github\.com|gitlab\.com|bitbucket\.org)/')
);

-- Indexes for services
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_subdomain ON services(subdomain);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_services_github_webhook_id ON services(github_webhook_id) WHERE github_webhook_id IS NOT NULL;

-- ============================================================================
-- DEPLOYMENTS TABLE
-- ============================================================================
CREATE TABLE deployments (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    
    -- Commit info
    commit_sha VARCHAR(40) NOT NULL,
    commit_message TEXT,
    commit_author VARCHAR(255),
    branch VARCHAR(255) NOT NULL,
    
    -- Deployment status
    status VARCHAR(50) DEFAULT 'queued' NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    
    -- Deployment result
    deployed_url TEXT,
    build_logs TEXT,
    error_message TEXT,
    
    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER
    ) STORED,
    
    -- Constraints
    CONSTRAINT status_valid CHECK (status IN ('queued', 'building', 'pushing_image', 'deploying', 'success', 'failed', 'cancelled')),
    CONSTRAINT trigger_type_valid CHECK (trigger_type IN ('webhook', 'manual', 'rollback', 'api')),
    CONSTRAINT commit_sha_format CHECK (commit_sha ~ '^[a-f0-9]{7,40}$') 
);

-- Indexes for deployments
CREATE INDEX idx_deployments_service_id ON deployments(service_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at DESC);
CREATE INDEX idx_deployments_commit_sha ON deployments(commit_sha);
CREATE INDEX idx_deployments_service_status ON deployments(service_id, status);
CREATE INDEX idx_deployments_service_created ON deployments(service_id, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for services table
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS (Optional but useful)
-- ============================================================================

-- View for latest deployment per service
CREATE VIEW latest_deployments AS
SELECT DISTINCT ON (service_id)
    d.*,
    s.name as service_name,
    s.subdomain,
    u.username
FROM deployments d
JOIN services s ON d.service_id = s.id
JOIN users u ON s.user_id = u.id
ORDER BY service_id, created_at DESC;

-- View for active services with deployment stats
CREATE VIEW service_stats AS
SELECT 
    s.id,
    s.name,
    s.subdomain,
    s.status,
    s.deploy_url,
    s.created_at,
    u.username,
    COUNT(d.id) as total_deployments,
    COUNT(d.id) FILTER (WHERE d.status = 'success') as successful_deployments,
    COUNT(d.id) FILTER (WHERE d.status = 'failed') as failed_deployments,
    MAX(d.created_at) as last_deployment_at
FROM services s
JOIN users u ON s.user_id = u.id
LEFT JOIN deployments d ON s.id = d.service_id
GROUP BY s.id, s.name, s.subdomain, s.status, s.deploy_url, s.created_at, u.username;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with GitHub OAuth support';
COMMENT ON TABLE services IS 'Deployed services/applications configuration';
COMMENT ON TABLE deployments IS 'Individual deployment instances with build history';

COMMENT ON COLUMN users.github_access_token IS 'OAuth token for GitHub API access (encrypted in production)';
COMMENT ON COLUMN services.env_vars IS 'Environment variables as JSON (encrypted in production)';
COMMENT ON COLUMN services.status IS 'Current deployment status of the service';
COMMENT ON COLUMN deployments.duration_seconds IS 'Auto-calculated deployment duration';
COMMENT ON COLUMN deployments.trigger_type IS 'What triggered this deployment';

-- ============================================================================
-- SAMPLE QUERIES (For testing)
-- ============================================================================

-- Get user's services with latest deployment
-- SELECT s.*, ld.status as latest_deployment_status, ld.created_at as latest_deployment_at
-- FROM services s
-- LEFT JOIN latest_deployments ld ON s.id = ld.service_id
-- WHERE s.user_id = 'user-uuid-here'
-- ORDER BY s.created_at DESC;

-- Get deployment history for a service
-- SELECT * FROM deployments
-- WHERE service_id = 'service-uuid-here'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Get services that need deployment
-- SELECT * FROM services
-- WHERE status IN ('created', 'failed')
-- ORDER BY created_at ASC;