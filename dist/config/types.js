"use strict";
/* eslint-disable no-shadow */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerDbTables = exports.DbModelStatus = exports.DbConnectionType = exports.SerializeFor = exports.PopulateFor = void 0;
/**
 * Model population strategies.
 */
var PopulateFor;
(function (PopulateFor) {
    PopulateFor["ALL"] = "all";
    PopulateFor["DB"] = "db";
    PopulateFor["ADMIN"] = "admin";
    PopulateFor["WORKER"] = "worker";
})(PopulateFor = exports.PopulateFor || (exports.PopulateFor = {}));
/**
 * Model serialization strategies.
 */
var SerializeFor;
(function (SerializeFor) {
    SerializeFor["ALL"] = "ALL";
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