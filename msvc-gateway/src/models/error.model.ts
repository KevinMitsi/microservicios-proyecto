export interface ProxyError {
  message: string;
  statusCode: number;
  service?: string;
  path?: string;
  timestamp: string;
}
