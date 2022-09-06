import { Model, prop } from '@rawmodel/core';
import { Pool, PoolConnection } from 'mysql2/promise';
import { DbModelStatus } from '../../config/types';
import { MySqlUtil } from '../db-connection/mysql-util';
/**
 * Update, delete and create actions options.
 */
export interface ActionOptions {
    conn?: PoolConnection;
    context?: {
        user?: any;
    };
}
/**
 * Common model related objects.
 */
export { prop };
/**
 * Base model.
 */
export declare abstract class BaseModel extends Model<any> {
    /**
     * Base model's id property definition.
     */
    id: number;
    /**
     * Time of creation.
     */
    _createTime: Date;
    /**
     * ID of the user that created the model.
     */
    _createUser: number;
    /**
     * Time of the last update.
     */
    _updateTime: Date;
    /**
     * ID of the user that updated the model.
     */
    _updateUser: number;
    /**
     * Base model's status property definition
     */
    status: number;
    /**
     * Model's table name.
     */
    abstract tableName: string;
    /**
     * Class constructor.
     *
     * @param data Input data.
     * @param context Application context.
     * @param parent Model's parent model.
     */
    constructor(data?: unknown, context?: any, parent?: Model);
    /**
     * Tells if the model represents a document stored in the database.
     */
    exists(): boolean;
    /**
     * Returns an instance of a database connection.
     */
    db(): Promise<Pool>;
    /**
     * Returns an instance of a sql utils.
     */
    sql(conn?: Pool): Promise<MySqlUtil>;
    /**
     * Returns DB connection with transaction support.
     *
     * @param conn Existing connection.
     * @returns {
     * singleTrans: Tells if connection will be used in transaction.
     * sql: MySqlUtil
     * conn: PoolConnection
     * }
     */
    getDbConnection(conn?: PoolConnection): Promise<{
        singleTrans: boolean;
        sql: MySqlUtil;
        conn: PoolConnection;
    }>;
    /**
     * Saves model data in the database as a new row. It will add only the
     * fields that are marked as serializable for insert DB
     *
     * @param options Create options.
     * @returns this
     */
    create(options?: ActionOptions): Promise<this>;
    /**
     * Updates model data in the database.  It will add only the
     * fields that are marked as serializable for update DB
     *
     * @param options Update options.
     * @returns this
     */
    update(options?: ActionOptions): Promise<this>;
    /**
     * Populates model fields by id.  It will only populate the
     * fields that are marked as serializable for populate DB.
     *
     * @param id Model's database ID.
     */
    populateById(id: any): Promise<this>;
    /**
     * Marks model as deleted in the database - soft delete.
     *
     * @param options Delete options.
     * @returns this
     */
    delete(options?: ActionOptions): Promise<this>;
    /**
     * Returns base model select fields used in querying.
     *
     * @param table Queried table synonym.
     * @returns Default select columns.
     */
    getSelectColumns(table: string): string;
    /**
     * Returns mapped default selected columns. Column name is mapped with the table prefix.
     *
     * @param table Queried table synonym.
     * @returns Default select mapped columns.
     */
    getMappedSelectColumns(table: string): string;
    /**
     * Parses mapped selected columns back to their original fields.
     *
     * @param table Queried table synonym.
     * @param data Data to parse from.
     * @returns Parsed default selected columns.
     */
    parseMappedSelectColumns(table: string, data: any): {
        id: number;
        status: DbModelStatus;
        _createTime: Date;
        _createUser: number;
        _updateTime: Date;
        _updateUser: number;
    };
}
//# sourceMappingURL=base.model.d.ts.map