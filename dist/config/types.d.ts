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
    ADMIN = "admin"
}
/**
 * Model serialization strategies.
 */
export declare enum SerializeFor {
    PROFILE = "profile",
    INSERT_DB = "insert_db",
    UPDATE_DB = "update_db",
    ADMIN = "admin"
}
export declare enum DbConnectionType {
    PRIMARY = "primary"
}
export interface IConnectionDetails {
    strategy?: ConnectionStrategy;
    host?: string;
    port?: number;
    database: string;
    poolSize?: number;
    user?: string;
}
export declare enum DbModelStatus {
    INACTIVE = 1,
    ACTIVE = 5,
    DELETED = 9
}
//# sourceMappingURL=types.d.ts.map