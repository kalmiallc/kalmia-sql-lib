/**
 * Connection details options.
 */
export interface IConnectionDetails {
  host?: string;
  port?: number;
  database: string;
  poolSize?: number;
  user?: string;
  ssl?: {
    ca?: string | string[];
    key?: string;
    cert?: string;
  };
}
