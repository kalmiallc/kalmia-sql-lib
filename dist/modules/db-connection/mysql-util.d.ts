import * as mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
/**
 * MySQL class.
 */
export declare class MySqlUtil {
    private _dbConnection;
    constructor(dbConnection: mysql.Connection | Pool);
    /**
     * Call single stored procedure inside transaction
     *
     * @param procedure name of procedure
     * @param data procedure parameters
     * @param [options={multiSet: boolean}] additional options
     */
    callSingle(procedure: string, data: unknown, options?: {
        multiSet?: boolean;
    }): Promise<any>;
    /**
     * Call stored procedure on database
     *
     * @param procedure procedure name
     * @param data Object with call parameters
     * @returns array of results from database
     */
    call(procedure: string, data: any, connection?: PoolConnection, options?: {
        multiSet?: boolean;
    }): Promise<any>;
    start(): Promise<PoolConnection>;
    commit(connection: PoolConnection): Promise<void>;
    rollback(connection: PoolConnection): Promise<void>;
    /**
     * Translate properties to array of property values for procedure call
     *
     * @param data Object to translate
     * @param [logOutput=false] For logging purpose we should mask the password values
     * @returns Array of values
     */
    mapValues(data: any, logOutput?: boolean): string[];
    /**
     *
     * @deprecated
     */
    paramQuery(query: string, values?: unknown): Promise<any[]>;
    /**
     * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
     * and executes prepared statement
     *
     * @param query SQL query
     * @param values object with replacement values
     * @param connection PoolConnection reference - needed if query is part of transaction
     */
    paramExecute(query: string, values?: unknown, connection?: PoolConnection): Promise<any[]>;
}
//# sourceMappingURL=mysql-util.d.ts.map