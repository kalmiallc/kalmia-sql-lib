import { ConnectionStrategy } from './types';

/**
 * Connection details options.
 */
export interface IConnectionDetails {
  strategy?: ConnectionStrategy;
  host?: string;
  port?: number;
  database: string;
  poolSize?: number;
  user?: string;
}
