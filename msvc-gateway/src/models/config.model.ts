export interface ServiceConfig {
  name: string;
  target: string;
  path: string;
  changeOrigin?: boolean;
  timeout?: number;
}

export interface GatewayConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string;
  logLevel: string;
  services: ServiceConfig[];
}
