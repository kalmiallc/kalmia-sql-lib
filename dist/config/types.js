"use strict";
/* eslint-disable no-shadow */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsolationLevel = exports.WorkerLogStatus = exports.WorkerDbTables = exports.DbModelStatus = exports.DbConnectionType = exports.SerializeFor = exports.PopulateFor = void 0;
/**
 * Model population strategies.
 */
var PopulateFor;
(function (PopulateFor) {
    PopulateFor["ALL"] = "all";
    PopulateFor["PUBLIC"] = "public";
    PopulateFor["DB"] = "db";
    PopulateFor["ADMIN"] = "admin";
    PopulateFor["WORKER"] = "worker";
})(PopulateFor || (exports.PopulateFor = PopulateFor = {}));
/**
 * Model serialization strategies.
 */
var SerializeFor;
(function (SerializeFor) {
    SerializeFor["ALL"] = "ALL";
    SerializeFor["PUBLIC"] = "public";
    SerializeFor["INSERT_DB"] = "insert_db";
    SerializeFor["UPDATE_DB"] = "update_db";
    SerializeFor["ADMIN"] = "admin";
    SerializeFor["WORKER"] = "worker";
})(SerializeFor || (exports.SerializeFor = SerializeFor = {}));
/**
 * Database connection type.
 */
var DbConnectionType;
(function (DbConnectionType) {
    DbConnectionType["PRIMARY"] = "primary";
})(DbConnectionType || (exports.DbConnectionType = DbConnectionType = {}));
/**
 * Base model database statuses.
 */
var DbModelStatus;
(function (DbModelStatus) {
    DbModelStatus[DbModelStatus["INACTIVE"] = 1] = "INACTIVE";
    DbModelStatus[DbModelStatus["ACTIVE"] = 5] = "ACTIVE";
    DbModelStatus[DbModelStatus["DELETED"] = 9] = "DELETED";
})(DbModelStatus || (exports.DbModelStatus = DbModelStatus = {}));
/**
 * List of possible worker database tables.
 */
var WorkerDbTables;
(function (WorkerDbTables) {
    WorkerDbTables["WORKER_JOB"] = "workerJob";
    WorkerDbTables["WORKER_LOG"] = "workerLog";
})(WorkerDbTables || (exports.WorkerDbTables = WorkerDbTables = {}));
var WorkerLogStatus;
(function (WorkerLogStatus) {
    WorkerLogStatus["DEBUG"] = "debug";
    WorkerLogStatus["START"] = "start";
    WorkerLogStatus["INFO"] = "info";
    WorkerLogStatus["WARNING"] = "warning";
    WorkerLogStatus["SUCCESS"] = "success";
    WorkerLogStatus["ERROR"] = "error";
})(WorkerLogStatus || (exports.WorkerLogStatus = WorkerLogStatus = {}));
var IsolationLevel;
(function (IsolationLevel) {
    IsolationLevel["READ_UNCOMMITTED"] = "READ UNCOMMITTED";
    IsolationLevel["READ_COMMITTED"] = "READ COMMITTED";
    IsolationLevel["REPEATABLE_READ"] = "REPEATABLE READ";
    IsolationLevel["READ_SERIALIZABLE"] = "READ SERIALIZABLE";
})(IsolationLevel || (exports.IsolationLevel = IsolationLevel = {}));
//# sourceMappingURL=types.js.map