"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerDbTables = exports.DbModelStatus = exports.DbConnectionType = exports.SerializeFor = exports.PopulateFor = exports.ConnectionStrategy = void 0;
/**
 * Connection strategy
 */
var ConnectionStrategy;
(function (ConnectionStrategy) {
    ConnectionStrategy["NO_POOL"] = "no_pool";
    ConnectionStrategy["LOCAL_POOL"] = "local_pool";
    ConnectionStrategy["RDS_PROXY_POOL"] = "rds_proxy_pool";
    ConnectionStrategy["LMD_OUT_OF_HANDLER_CONN"] = "lmd_out_of_handler_conn";
})(ConnectionStrategy = exports.ConnectionStrategy || (exports.ConnectionStrategy = {}));
/**
 * Model population strategies.
 */
var PopulateFor;
(function (PopulateFor) {
    PopulateFor["PROFILE"] = "profile";
    PopulateFor["DB"] = "db";
    PopulateFor["ADMIN"] = "admin";
    PopulateFor["WORKER"] = "worker";
})(PopulateFor = exports.PopulateFor || (exports.PopulateFor = {}));
/**
 * Model serialization strategies.
 */
var SerializeFor;
(function (SerializeFor) {
    SerializeFor["PROFILE"] = "profile";
    SerializeFor["INSERT_DB"] = "insert_db";
    SerializeFor["UPDATE_DB"] = "update_db";
    SerializeFor["ADMIN"] = "admin";
    SerializeFor["WORKER"] = "worker";
})(SerializeFor = exports.SerializeFor || (exports.SerializeFor = {}));
/**
 * Database connection type.
 */
var DbConnectionType;
(function (DbConnectionType) {
    DbConnectionType["PRIMARY"] = "primary";
})(DbConnectionType = exports.DbConnectionType || (exports.DbConnectionType = {}));
/**
 * Base model database statuses.
 */
var DbModelStatus;
(function (DbModelStatus) {
    DbModelStatus[DbModelStatus["INACTIVE"] = 1] = "INACTIVE";
    DbModelStatus[DbModelStatus["ACTIVE"] = 5] = "ACTIVE";
    DbModelStatus[DbModelStatus["DELETED"] = 9] = "DELETED";
})(DbModelStatus = exports.DbModelStatus || (exports.DbModelStatus = {}));
/**
 * List of possible worker database tables.
 */
var WorkerDbTables;
(function (WorkerDbTables) {
    WorkerDbTables["WORKER_JOB"] = "workerJob";
    WorkerDbTables["WORKER_LOG"] = "workerLog";
})(WorkerDbTables = exports.WorkerDbTables || (exports.WorkerDbTables = {}));
//# sourceMappingURL=types.js.map