/* eslint-disable no-shadow */

/**
 * Model population strategies.
 */
export enum PopulateFor {
  ALL = 'all',
  DB = 'db',
  ADMIN = 'admin',
  WORKER = 'worker'
}

/**
 * Model serialization strategies.
 */
export enum SerializeFor {
  ALL = 'ALL',
  INSERT_DB = 'insert_db',
  UPDATE_DB = 'update_db',
  ADMIN = 'admin',
  WORKER = 'worker'
}

/**
 * Database connection type.
 */
export enum DbConnectionType {
  PRIMARY = 'primary'
}

/**
 * Base model database statuses.
 */
export enum DbModelStatus {
  INACTIVE = 1,
  ACTIVE = 5,
  DELETED = 9
}

/**
 * List of possible worker database tables.
 */
export enum WorkerDbTables {
  WORKER_JOB = 'workerJob',
  WORKER_LOG = 'workerLog'
}
