/**
 * Connection strategy
 */
export declare enum ConnectionStrategy {
    NO_POOL = "no_pool",
    LOCAL_POOL = "local_pool",
    RDS_PROXY_POOL = "rds_proxy_pool",
    LMD_OUT_OF_HANDLER_CONN = "lmd_out_of_handler_conn"
}
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