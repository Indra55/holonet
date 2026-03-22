export type Runtime = 'node' | 'python' | 'go' | 'static';
export type ServiceStatus = 'created' | 'pending_deployment' | 'deployed' | 'failed';
export type DeploymentStatus = 'queued' | 'building' | 'pushing_image' | 'deploying' | 'success' | 'failed';
export type TriggerType = 'manual' | 'webhook';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
}

export interface Service {
  id: string;
  name: string;
  subdomain: string;
  runtime: Runtime;
  branch: string;
  root_directory: string;
  repo_url: string;
  build_cmd: string;
  start_cmd: string;
  status: ServiceStatus;
  deploy_url: string;
  created_at: string;
  updated_at: string;
  env_vars?: Record<string, string>;
}

export interface Deployment {
  id: string;
  commit_sha: string;
  commit_message: string;
  commit_author: string;
  branch: string;
  status: DeploymentStatus;
  trigger_type: TriggerType;
  deployed_url: string;
  error_message: string;
  created_at: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
}

export interface LogEvent {
  type?: 'history' | 'done';
  status?: DeploymentStatus | 'success' | 'failed';
  log: string;
  timestamp?: string;
}
