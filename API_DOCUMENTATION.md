# HOLONET API Documentation

## What is HOLONET?

HOLONET is not just another deployment platform—it's a rebellion against the walled gardens of modern cloud services. Imagine having the raw power of bare-metal infrastructure combined with the developer experience of platforms like Vercel or Netlify, but without the vendor lock-in, arbitrary limits, or sky-high bills.

At its core, HOLONET is a self-hosted deployment engine that transforms your Git repositories into live applications within seconds. Push your code, and watch as it automatically gets containerized, deployed, and served through intelligent load balancing—all on infrastructure you control. Whether you're deploying Node.js apps, Python APIs, Go services, or static sites, HOLONET handles the heavy lifting while you focus on writing code.

The platform operates on a simple philosophy: **your code, your infrastructure, your rules**. No more negotiating with support teams for resource increases, no more surprise bills, and no more wondering if your data is secure. HOLONET gives you enterprise-grade deployment capabilities with the freedom that only open-source, self-hosted solutions can provide.

Built for developers who value both productivity and independence, HOLONET combines cutting-edge technologies like Docker containers, Redis-powered queues, and intelligent Nginx routing with a sleek React frontend. The result? A deployment experience that feels magical while remaining completely transparent and under your control.

This is the end of托管 dependence. This is the beginning of deployment freedom. This is HOLONET.

---

## Overview

The HOLONET API provides RESTful endpoints for managing users, services, deployments, and webhooks. This document outlines all available endpoints, request/response formats, authentication requirements, and usage examples.

## Base URL

```
Production: https://holonet.hitanshu.xyz
Development: http://localhost:3000
```

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT tokens. Include the token in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

Or use HTTP-only cookies (automatically set after OAuth login).

### Session Management

- **Token Expiry**: 7 days
- **Refresh**: Automatic via cookies
- **Secure**: HTTP-only cookies in production

## Data Types

### Common Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### UUID Format

All IDs use UUIDv7 format: `018f8b5c-4a7b-7c8d-9e0f-1a2b3c4d5e6f`

## Endpoints

## Authentication Endpoints

### GitHub OAuth Initiation

```http
GET /api/auth/github?join_code=<optional>
```

**Query Parameters:**
- `join_code` (optional): Team invitation code

**Response:** Redirects to GitHub OAuth page

**Example:**
```bash
curl "https://api.holonet.example.com/api/auth/github"
```

### GitHub OAuth Callback

```http
GET /api/auth/github/callback
```

**Response:** Redirects to frontend with authentication cookies set

### User Registration

```http
POST /api/auth/register
```

**Request Body:**
```typescript
{
  username: string;     // 3-30 chars, alphanumeric + underscore
  email: string;        // Valid email format
  password: string;     // Min 8 chars
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    username: string;
    email: string;
    created_at: string;
  }
}
```

**Example:**
```bash
curl -X POST https://api.holonet.example.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### User Login

```http
POST /api/auth/login
```

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    username: string;
    email: string;
    github_username?: string;
  }
}
```

### Get Current User

```http
GET /api/auth/me
```

**Authentication:** Required

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    username: string;
    email: string;
    github_username?: string;
    github_user_id?: string;
    created_at: string;
  }
}
```

### Logout

```http
POST /api/auth/logout
```

**Authentication:** Required

**Response:**
```typescript
{
  success: true,
  message: "Logged out successfully"
}
```

## Service Endpoints

### Create Service

```http
POST /api/services/create_service
```

**Authentication:** Required

**Request Body:**
```typescript
{
  name: string;           // Service display name
  repo_url: string;       // Git repository URL
  runtime: string;        // "node" | "python" | "go" | "static"
  branch?: string;        // Default: "main"
  root_directory?: string; // Default: "/"
  subdomain: string;      // 3-63 chars, lowercase alphanumeric + hyphens
  build_cmd?: string;     // Custom build command
  start_cmd?: string;     // Custom start command
  env_vars?: object;      // Environment variables as JSON
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subdomain: string;
    repo_url: string;
    runtime: string;
    status: "created" | "pending_deployment" | "deploying" | "deployed" | "failed";
    deploy_url?: string;
    created_at: string;
  }
}
```

**Example:**
```bash
curl -X POST https://api.holonet.example.com/api/services/create_service \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My React App",
    "repo_url": "https://github.com/user/my-react-app",
    "runtime": "node",
    "subdomain": "myapp",
    "build_cmd": "npm run build",
    "start_cmd": "npm start"
  }'
```

### List User Services

```http
GET /api/services
```

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by status

**Response:**
```typescript
{
  success: true,
  data: {
    services: Service[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }
}
```

### Get Service Details

```http
GET /api/services/:id
```

**Authentication:** Required

**Path Parameters:**
- `id`: Service UUID

**Response:**
```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subdomain: string;
    repo_url: string;
    branch: string;
    root_directory: string;
    runtime: string;
    build_cmd?: string;
    start_cmd?: string;
    env_vars: object;
    status: string;
    deploy_url?: string;
    github_webhook_id?: string;
    created_at: string;
    updated_at: string;
  }
}
```

### Update Service

```http
PUT /api/services/:id
```

**Authentication:** Required

**Path Parameters:**
- `id`: Service UUID

**Request Body:**
```typescript
{
  name?: string;
  branch?: string;
  root_directory?: string;
  build_cmd?: string;
  start_cmd?: string;
  env_vars?: object;
}
```

**Response:**
```typescript
{
  success: true,
  data: Service;
}
```

### Delete Service

```http
DELETE /api/services/:id
```

**Authentication:** Required

**Path Parameters:**
- `id`: Service UUID

**Response:**
```typescript
{
  success: true,
  message: "Service deleted successfully"
}
```

### Trigger Manual Deployment

```http
POST /api/services/:id/deploy
```

**Authentication:** Required

**Path Parameters:**
- `id`: Service UUID

**Response:**
```typescript
{
  success: true,
  data: {
    deployment_id: string;
    status: "queued";
    message: "Deployment queued successfully"
  }
}
```

### Get Deployment History

```http
GET /api/services/:id/deployments
```

**Authentication:** Required

**Path Parameters:**
- `id`: Service UUID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status

**Response:**
```typescript
{
  success: true,
  data: {
    deployments: Deployment[];
    pagination: PaginationInfo;
  }
}
```

## Deployment Data Types

### Service Object

```typescript
interface Service {
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
}
```

### Deployment Object

```typescript
interface Deployment {
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
}
```

## Webhook Endpoints

### GitHub Webhook Handler

```http
POST /api/webhooks/github
```

**Authentication:** None (webhook signature verification)

**Headers:**
- `X-Hub-Signature-256`: HMAC signature
- `X-GitHub-Event`: Event type

**Request Body:** GitHub webhook payload

**Response:**
```typescript
{
  success: true,
  message: "Webhook processed successfully"
}
```

## Error Handling

### Error Response Format

```typescript
{
  success: false,
  error: string;
  code?: string;
  details?: any;
}
```

### HTTP Status Codes

| Code | Description | Example Scenarios |
|------|-------------|-------------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Invalid email or password |
| `USER_NOT_FOUND` | User does not exist |
| `SERVICE_NOT_FOUND` | Service does not exist |
| `SUBDOMAIN_TAKEN` | Subdomain already in use |
| `INVALID_REPO_URL` | Invalid Git repository URL |
| `DEPLOYMENT_FAILED` | Deployment process failed |
| `WEBHOOK_SIGNATURE_INVALID` | Invalid webhook signature |

## Rate Limiting

### Endpoints Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 requests | 15 minutes |
| Service Creation | 5 requests | 1 hour |
| Manual Deployment | 10 requests | 1 hour |
| Other endpoints | 100 requests | 15 minutes |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Validation Rules

### Username
- Length: 3-30 characters
- Format: Alphanumeric + underscore
- Regex: `^[a-zA-Z0-9_]+$`

### Email
- Standard email format
- Regex: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`

### Password
- Minimum 8 characters

### Subdomain
- Length: 3-63 characters
- Format: Lowercase alphanumeric + hyphens
- No leading/trailing hyphens
- Regex: `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`

### Git Repository URL
- Must start with http:// or https://
- Supported hosts: github.com, gitlab.com, bitbucket.org
- Regex: `^https?://(github\.com|gitlab\.com|bitbucket\.org)/`

## SDK Examples

### JavaScript/TypeScript

```typescript
class HolonetAPI {
  constructor(private baseURL: string, private token?: string) {}

  async createService(data: CreateServiceRequest): Promise<Service> {
    const response = await fetch(`${this.baseURL}/api/services/create_service`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  }

  async getServices(options?: ListServicesOptions): Promise<ServiceList> {
    const params = new URLSearchParams(options as any);
    const response = await fetch(`${this.baseURL}/api/services?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  }
}

// Usage
const api = new HolonetAPI('https://holonet.hitanshu.xyz', token);

const service = await api.createService({
  name: 'My App',
  repo_url: 'https://github.com/user/my-app',
  runtime: 'node',
  subdomain: 'myapp',
});
```

### Python

```python
import requests
from typing import Dict, Any, Optional

class HolonetAPI:
    def __init__(self, base_url: str, token: Optional[str] = None):
        self.base_url = base_url
        self.session = requests.Session()
        if token:
            self.session.headers.update({'Authorization': f'Bearer {token}'})
    
    def create_service(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f'{self.base_url}/api/services/create_service',
            json=data
        )
        result = response.json()
        if not result.get('success'):
            raise Exception(result.get('error'))
        return result['data']
    
    def get_services(self, **params) -> Dict[str, Any]:
        response = self.session.get(
            f'{self.base_url}/api/services',
            params=params
        )
        result = response.json()
        if not result.get('success'):
            raise Exception(result.get('error'))
        return result['data']

# Usage
api = HolonetAPI('https://api.holonet.example.com', token=token)

service = api.create_service({
    'name': 'My App',
    'repo_url': 'https://github.com/user/my-app',
    'runtime': 'node',
    'subdomain': 'myapp'
})
```

## Webhook Integration

### GitHub Webhook Setup

1. Navigate to repository settings
2. Add webhook URL: `https://api.holonet.example.com/api/webhooks/github`
3. Set content type: `application/json`
4. Add secret: Same as `WEBHOOK_SECRET` environment variable
5. Select events: Pushes, Pull requests

### Webhook Events

| Event | Trigger | Action |
|-------|---------|--------|
| `push` | Code pushed to branch | Auto-deploy if matches service branch |
| `pull_request` | PR opened/closed | Optional deployment trigger |
| `release` | New release created | Deploy tagged version |

### Webhook Signature Verification

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
}
```

## Testing

### Environment Setup

Use the test environment for development:

```bash
# Test API base URL
export HOLONET_API_URL="https://holonet.hitanshu.xyz"

# Test user credentials
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="testpassword123"
```

### Example Test Cases

```bash
# Test user registration
curl -X POST https://holonet.hitanshu.xyz/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Test service creation
curl -X POST https://holonet.hitanshu.xyz/api/services/create_service \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Service",
    "repo_url": "https://github.com/example/test-repo",
    "runtime": "node",
    "subdomain": "test"
  }'
```

## Changelog

### v1.0.0
- Initial API release
- User authentication via GitHub OAuth
- Service management endpoints
- Deployment queue system
- Webhook integration

### v1.1.0 (Planned)
- Team management endpoints
- Environment variable encryption
- Deployment rollback functionality
- Advanced monitoring endpoints

## Support

For API support:
- Documentation: [docs.holonet.hitanshu.xyz](https://docs.holonet.hitanshu.xyz)
- API Status: [status.holonet.hitanshu.xyz](https://status.holonet.hitanshu.xyz)
- Issues: [GitHub Issues](https://github.com/indra55/holonet/issues)
- Email: api-support@holonet.dev
