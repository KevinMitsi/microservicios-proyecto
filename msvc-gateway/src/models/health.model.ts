export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceStatus[];
}

export interface ServiceStatus {
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
}
