import { numberSizeValidator, presenceValidator } from '@rawmodel/validators';
import { DbModelStatus } from '../../config/types';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';
import { BaseModel } from './base.model';

/**
 * Expose standard validators.
 */
export { numberSizeValidator, presenceValidator };

/**
 * Validates uniqueness of the field value of the given entity.
 * @param tableName
 * @param fieldName
 * @param idField
 * @param checkNull
 * @returns
 */
export function uniqueFieldWithIdValidator(sqlTableName: string, fieldName: string, idField = 'id', checkNull = false) {
  return async function (this: BaseModel | any, value: any) {
    if ((!checkNull && value === null) || value === undefined) {
      return true;
    }
    const count = await new MySqlUtil(await MySqlConnManager.getInstance().getConnection())
      .paramExecute(
        `
      SELECT COUNT(*) as Count FROM \`${sqlTableName}\`
      WHERE \`${fieldName}\` = @value
      AND (@id IS NULL OR (@id IS NOT NULL AND \`${idField}\` <> @id ))`,
        { value, id: this[idField] }
      )
      .then((rows) => rows[0].Count);

    return count === 0;
  };
}

/**
 * Validates uniqueness of the field value.
 * @param tableName
 * @param field
 * @param checkNull
 * @returns
 */
export function uniqueFieldValidator(tableName: string, field: string, checkNull = false) {
  return async function (this: BaseModel | any, value: any) {
    if ((!checkNull && value === null) || value === undefined) {
      return true;
    }

    const count = await new MySqlUtil(await MySqlConnManager.getInstance().getConnection())
      .paramExecute(
        `
      SELECT COUNT(*) as Count FROM \`${tableName}\`
      WHERE \`${field}\` = @value`,
        { value }
      )
      .then((rows: any) => rows[0].Count);

    return count === 0;
  };
}

/**
 * Checks for the existence of the resources specified as foreign key prop.
 * @param tableName Table name of the foreign key resource.
 * @param idField Foreign key id.
 * @param checkNull
 * @returns boolean
 */
export function foreignKeyExistence(tableName: string, idField = 'id', checkNull = false) {
  return async function (this: BaseModel | any, value: any) {
    if ((!checkNull && value === null) || value === undefined) {
      return true;
    }

    const count = await new MySqlUtil(await MySqlConnManager.getInstance().getConnection())
      .paramExecute(
        `
      SELECT COUNT(*) as Count FROM \`${tableName}\`
      WHERE \`${idField}\` = @value
      AND status < ${DbModelStatus.DELETED}`,
        { value }
      )
      .then((rows: any) => Number(rows[0].Count));

    return count === 0;
  };
}
