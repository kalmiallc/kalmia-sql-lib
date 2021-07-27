import { numberSizeValidator, presenceValidator } from '@rawmodel/validators';
import { Pool } from 'mysql2/promise';
import { MySqlUtil } from '../db-connection/mysql-util';
import { BaseModel } from './base.model'; 

/**
 * Expose standard validators.
 */
export { numberSizeValidator, presenceValidator };

/**
 * Validates if value is inside enumerator
 */
export function enumInclusionValidator(enumerator: any, allowNull = false) {
  return function (value: any) {
    if (allowNull && (value === null || value === undefined)) {
      return true;
    }

    let valid = false;
    for (const key in enumerator) {
      if (Object.prototype.hasOwnProperty.call(enumerator, key) && value === enumerator[key]) {
        valid = true;
        break;
      }
    }
    return valid;
  };
}

/**
 * Validates uniqueness of field value.
 */
export function uniqueFieldValue(sqlTableName: string, fieldName: string, idField = 'id', checkNull = false) {
  return async function (this: BaseModel, value: any) {
    if ((!checkNull && value === null) || value === undefined) {
      return true;
    }
    const count = await new MySqlUtil((await this.db()) as Pool)
      .paramExecute(
        `
      SELECT COUNT(*) as Count FROM \`${sqlTableName}\`
      WHERE \`${fieldName}\` = @value
      AND (@id IS NULL OR (@id IS NOT NULL AND \`${idField}\` <> @id ))`,
        { value, id: this.id }
      )
      .then((rows) => rows[0].Count);

    return count === 0;
  };
}
