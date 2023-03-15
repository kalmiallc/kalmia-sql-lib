import { numberSizeValidator, presenceValidator } from '@rawmodel/validators';
import { BaseModel } from './base.model';
/**
 * Expose standard validators.
 */
export { numberSizeValidator, presenceValidator };
/**
 * Validates uniqueness of the field value of the given entity.
 *
 * @param tableName
 * @param fieldName
 * @param idField
 * @param checkNull
 * @returns
 */
export declare function uniqueFieldWithIdValidator(sqlTableName: string, fieldName: string, idField?: string, checkNull?: boolean): (this: BaseModel | any, value: any) => Promise<boolean>;
/**
 * Validates uniqueness of the field value.
 *
 * @param tableName
 * @param field
 * @param checkNull
 * @returns
 */
export declare function uniqueFieldValidator(tableName: string, field: string, checkNull?: boolean): (this: BaseModel | any, value: any) => Promise<boolean>;
/**
 * Checks for the existence of the resources specified as foreign key prop.
 *
 * @param tableName Table name of the foreign key resource.
 * @param idField Foreign key id.
 * @param checkNull
 * @returns boolean
 */
export declare function foreignKeyExistence(tableName: string, idField?: string, checkNull?: boolean): (this: BaseModel | any, value: any) => Promise<boolean>;
/**
 * Validates the uniqueness of the existing model field.
 *
 * @param fieldName Name of the field to validate.
 * @returns boolean
 */
export declare function existingModelFieldUniquenessValidator(tableName: string, fieldName: string, checkNull?: boolean): (this: BaseModel, value: any) => Promise<boolean>;
//# sourceMappingURL=validators.d.ts.map