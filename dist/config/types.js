"use strict";
/* eslint-disable no-shadow */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbModelStatus = exports.DbConnectionType = exports.SerializeFor = exports.PopulateFor = exports.ConnectionStrategy = void 0;
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
})(SerializeFor = exports.SerializeFor || (exports.SerializeFor = {}));
var DbConnectionType;
(function (DbConnectionType) {
    DbConnectionType["PRIMARY"] = "primary";
})(DbConnectionType = exports.DbConnectionType || (exports.DbConnectionType = {}));
// eslint-disable-next-line no-shadow
var DbModelStatus;
(function (DbModelStatus) {
    DbModelStatus[DbModelStatus["INACTIVE"] = 1] = "INACTIVE";
    DbModelStatus[DbModelStatus["ACTIVE"] = 5] = "ACTIVE";
    DbModelStatus[DbModelStatus["DELETED"] = 9] = "DELETED";
})(DbModelStatus = exports.DbModelStatus || (exports.DbModelStatus = {}));
//# sourceMappingURL=types.js.map