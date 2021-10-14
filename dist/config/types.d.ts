/**
 * Model population strategies.
 */
export declare enum PopulateFor {
    PROFILE = "profile",
    DB = "db",
    ADMIN = "admin",
    WORKER = "worker"
}
/**
 * Model serialization strategies.
 */
export declare enum SerializeFor {
    PROFILE = "profile",
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
//# sourceMappingURL=types.d.ts.map