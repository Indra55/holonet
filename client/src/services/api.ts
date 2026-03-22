import { Service, Deployment, User, Runtime } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3000');

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Redirect to login handled by useAuth or router
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return response;
};

export const api = {
  auth: {
    me: async (): Promise<{ user: User }> => {
      const res = await fetchWithAuth('/api/auth/me');
      return res.json();
    },
    logout: async () => {
      return fetchWithAuth('/api/auth/logout', { method: 'POST' });
    },
    getGithubAuthUrl: () => `${API_BASE_URL}/api/auth/github`,
  },
  services: {
    list: async (params?: { status?: string; limit?: number; offset?: number }): Promise<{ services: Service[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetchWithAuth(`/api/services${query ? `?${query}` : ''}`);
      return res.json();
    },
    get: async (id: string): Promise<Service & { latest_deployment?: Deployment }> => {
      const res = await fetchWithAuth(`/api/services/${id}`);
      return res.json();
    },
    create: async (data: {
      name: string;
      repo_url: string;
      runtime: Runtime;
      branch?: string;
      root_directory?: string;
      subdomain: string;
      build_cmd?: string;
      start_cmd?: string;
    }): Promise<Service> => {
      const res = await fetchWithAuth('/api/services/create_service', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    deploy: async (id: string): Promise<{ deploymentId: string }> => {
      const res = await fetchWithAuth(`/api/services/${id}/deploy`, { method: 'POST' });
      return res.json();
    },
    getDeployments: async (id: string): Promise<Deployment[]> => {
      const res = await fetchWithAuth(`/api/services/${id}/deployments`);
      return res.json();
    },
    getLogs: async (serviceId: string, deploymentId: string): Promise<string> => {
      const res = await fetchWithAuth(`/api/services/${serviceId}/deployments/${deploymentId}/logs`);
      const data = await res.json();
      return data.logs;
    },
    updateEnv: async (id: string, env_vars: Record<string, string>): Promise<void> => {
      await fetchWithAuth(`/api/services/${id}/env`, {
        method: 'PATCH',
        body: JSON.stringify({ env_vars }),
      });
    },
    delete: async (id: string): Promise<void> => {
      await fetchWithAuth(`/api/services/${id}`, { method: 'DELETE' });
    },
    getLogStreamUrl: (serviceId: string, deploymentId: string) => 
      `${API_BASE_URL}/api/services/${serviceId}/deployments/${deploymentId}/logs/stream`,
  },
};
