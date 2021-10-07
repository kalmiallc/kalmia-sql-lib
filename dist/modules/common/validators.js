"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foreignKeyExistence = exports.uniqueFieldValidator = exports.uniqueFieldWithIdValidator = exports.presenceValidator = exports.numberSizeValidator = void 0;
const validators_1 = require("@rawmodel/validators");
Object.defineProperty(exports, "numberSizeValidator", { enumerable: true, get: function () { return validators_1.numberSizeValidator; } });
Object.defineProperty(exports, "presenceValidator", { enumerable: true, get: function () { return validators_1.presenceValidator; } });
const types_1 = require("../../config/types");
const mysql_conn_manager_1 = require("../db-connection/mysql-conn-manager");
const mysql_util_1 = require("../db-connection/mysql-util");
/**
 * Validates uniqueness of the field value of the given entity.
 * @param tableName
 * @param fieldName
 * @param idField
 * @param checkNull
 * @returns
 */
function uniqueFieldWithIdValidator(sqlTableName, fieldName, idField = 'id', checkNull = false) {
    return async function (value) {
        if ((!checkNull && value === null) || value === undefined) {
            return true;
        }
        const count = await new mysql_util_1.MySqlUtil(await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection())
            .paramExecute(`
      SELECT COUNT(*) as Count FROM \`${sqlTableName}\`
      WHERE \`${fieldName}\` = @value
      AND (@id IS NULL OR (@id IS NOT NULL AND \`${idField}\` <> @id ))`, { value, id: this[idField] })
            .then((rows) => rows[0].Count);
        return count === 0;
    };
}
exports.uniqueFieldWithIdValidator = uniqueFieldWithIdValidator;
/**
 * Validates uniqueness of the field value.
 * @param tableName
 * @param field
 * @param checkNull
 * @returns
 */
function uniqueFieldValidator(tableName, field, checkNull = false) {
    return async function (value) {
        if ((!checkNull && value === null) || value === undefined) {
            return true;
        }
        const count = await new mysql_util_1.MySqlUtil(await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection())
            .paramExecute(`
      SELECT COUNT(*) as Count FROM \`${tableName}\`
      WHERE \`${field}\` = @value`, { value })
            .then((rows) => rows[0].Count);
        return count === 0;
    };
}
exports.uniqueFieldValidator = uniqueFieldValidator;
/**
 * Checks for the existence of the resources specified as foreign key prop.
 * @param tableName Table name of the foreign key resource.
 * @param idField Foreign key id.
 * @param checkNull
 * @returns boolean
 */
function foreignKeyExistence(tableName, idField = 'id', checkNull = false) {
    return async function (value) {
        if ((!checkNull && value === null) || value === undefined) {
            return true;
        }
        const count = await new mysql_util_1.MySqlUtil(await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection())
            .paramExecute(`
      SELECT COUNT(*) as Count FROM \`${tableName}\`
      WHERE \`${idField}\` = @value
      AND status < ${types_1.DbModelStatus.DELETED}`, { value })
            .then((rows) => Number(rows[0].Count));
        return count === 0;
    };
}
exports.foreignKeyExistence = foreignKeyExistence;
//# sourceMappingURL=validators.js.map