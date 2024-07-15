"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presenceValidator = exports.numberSizeValidator = void 0;
exports.uniqueFieldWithIdValidator = uniqueFieldWithIdValidator;
exports.uniqueFieldValidator = uniqueFieldValidator;
exports.foreignKeyExistence = foreignKeyExistence;
exports.existingModelFieldUniquenessValidator = existingModelFieldUniquenessValidator;
const validators_1 = require("@rawmodel/validators");
Object.defineProperty(exports, "numberSizeValidator", { enumerable: true, get: function () { return validators_1.numberSizeValidator; } });
Object.defineProperty(exports, "presenceValidator", { enumerable: true, get: function () { return validators_1.presenceValidator; } });
const types_1 = require("../../config/types");
const mysql_conn_manager_1 = require("../db-connection/mysql-conn-manager");
const mysql_util_1 = require("../db-connection/mysql-util");
/**
 * Validates uniqueness of the field value of the given entity.
 *
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
/**
 * Validates uniqueness of the field value.
 *
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
/**
 * Checks for the existence of the resources specified as foreign key prop.
 *
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
/**
 * Validates the uniqueness of the existing model field.
 *
 * @param fieldName Name of the field to validate.
 * @returns boolean
 */
function existingModelFieldUniquenessValidator(tableName, fieldName, checkNull = false) {
    return async function (value) {
        if ((!checkNull && value === null) || value === undefined) {
            return true;
        }
        const count = await new mysql_util_1.MySqlUtil((await this.db()))
            .paramExecute(`
      SELECT COUNT(*) as count FROM \`${tableName}\`
      WHERE
        \`${fieldName}\` = @value
        AND status <> ${types_1.DbModelStatus.DELETED}
        AND (@id IS NULL OR (@id IS NOT NULL AND id <> @id ))
      `, { value, id: this.id || null })
            .then((rows) => rows[0].count);
        return count === 0;
    };
}
//# sourceMappingURL=validators.js.map