/**
 * Model population strategies.
 */
export declare enum PopulateFor {
    ALL = "all",
    PUBLIC = "public",
    DB = "db",
    ADMIN = "admin",
    WORKER = "worker"
}
/**
 * Model serialization strategies.
 */
export declare enum SerializeFor {
    ALL = "ALL",
    PUBLIC = "public",
    INSERT_DB = "insert_db",
    UPDATE_DB = "update_db",
    ADMIN = "admin",
    WORKER = "worker"
}
/**
 * Database connection type.
 */
export declare enum DbConnectionType {
    PRIMARY = "primary"
}
/**
 * Base model database statuses.
 */
export declare enum DbModelStatus {
    INACTIVE = 1,
    ACTIVE = 5,
    DELETED = 9
}
/**
 * List of possible worker database tables.
 */
export declare enum WorkerDbTables {
    WORKER_JOB = "workerJob",
    WORKER_LOG = "workerLog"
}
export declare enum WorkerLogStatus {
    DEBUG = "debug",
    START = "start",
    INFO = "info",
    WARNING = "warning",
    SUCCESS = "success",
    ERROR = "error"
}
//# sourceMappingURL=types.d.ts.map