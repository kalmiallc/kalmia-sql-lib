import * as mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';
import { IsolationLevel } from '../../config/types';
/**
 * MySQL helper. This helper is designed for usage of SQL connection pool.
 * Methods with direct -- use direct connection pooling, no need to get instances from the connection pool.
 */
export declare class MySqlUtil {
    private _dbConnectionPool;
    private _currentPooledConnection;
    constructor(dbConnection?: Pool);
    /**
     * This method will initialize connection from the connection pool. It will use connection manager and initialize primary connection as connection poll.
     * It will also open single connection for from the pool ans set it as the active connection if the parameter is set to true;
     *
     * If set setPoledInstance is true, make sure that the active connection is released after usage.
     * Use releaseActiveConnection() method to release the connection.
     *
     * @param [setPoledInstance] if true, the connection will be polled from the pool and set as the active connection
     * @returns {Promise<MySqlUtil>} returns instance of MySqlUtil
     */
    static init(setPoledInstance?: boolean): Promise<MySqlUtil>;
    /**
     * End all active connections from using the connection manager.
     */
    static end(): Promise<void>;
    /**
     * Initializes connection from the connection pool and starts transaction.
     *
     * Make sure you close the connection after usage. Use releaseActiveConnection() method to release the connection or conn close.
     *
     * @returns {{ sql: MySqlUtil; conn: PoolConnection }} returns active connection from the pool, and instance of MySqlUtil
     * @throws {Error} if active connection is not set
     *
     */
    static initAndStartTrans(): Promise<{
        sql: MySqlUtil;
        conn: PoolConnection;
    }>;
    /**
     * End all active connections. Also close active instance of connection form the pool.
     */
    end(): Promise<void>;
    /**
     * Returns the connection pool from the instance.
     *
     * @returns {Pool}
     */
    getConnectionPool(): Pool;
    /**
     * Set active connection (pool connection)
     */
    setActiveConnection(ac: PoolConnection): void;
    /**
     * Get active connection (pool connection)
     */
    getActiveConnection(): mysql.PoolConnection;
    /**
     * Release active connection (pool connection)
     */
    releaseActiveConnection(): void;
    /**
     * Call single stored procedure inside transaction, and make commit.
     * In case of error the transaction is rolled back.
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
    /**
     * Call stored procedure on database. This method uses automatic connection picking from the connection pool.
     *
     * @param procedure procedure name
     * @param data Object with call parameters
     * @returns array of results from database
     */
    callDirect(procedure: string, data: any, options?: {
        multiSet?: boolean;
    }): Promise<any>;
    /**
     * This function takes a new connection form the poll and starts transaction.
     *
     * @param isolationLevel Database isolation level for this transaction. Isolation level will only affect next query, execution, the it will be reset to default.
     * @returns connection from the pool.
     */
    start(isolationLevel?: IsolationLevel): Promise<PoolConnection>;
    commit(connection?: PoolConnection): Promise<void>;
    rollback(connection?: PoolConnection): Promise<void>;
    /**
     * Translate properties to array of property values for procedure call
     *
     * @param data Object to translate
     * @param [logOutput=false] For logging purpose we should mask the password values
     * @returns Array of values
     */
    mapValues(data: any, logOutput?: boolean): string[];
    /**
     * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
     * and executes prepared statement. If there is no connection added to the parameter (or no current pooled connection present on the object)
     * then a new connection will be taken from the pool and released after.
     *
     * @dev Throws an error if isolation level and connection are provided. Isolation cannot be changed inside a transaction.
     * @param query SQL query
     * @param values object with replacement values
     * @param connection PoolConnection reference - needed if query is part of transaction
     * @param isolationLevel Database isolation level for this query. Isolation level will only affect next query, execution, the it will be reset to default.
     */
    paramExecute(query: string, values?: unknown, connection?: PoolConnection, isolationLevel?: IsolationLevel): Promise<any[]>;
    /**
     * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
     * This function uses automatic connection creation and release functionality of mysql lib.
     *
     * @param query SQL query
     * @param values object with replacement values
     * @param isolationLevel Database isolation level for this query. Isolation level will only affect next query, execution, the it will be reset to default.
     *
     */
    paramExecuteDirect(query: string, values?: unknown, isolationLevel?: IsolationLevel): Promise<any[]>;
    /**
     * Helper for lambda functions. This will kill all the stalled connections in the pool.
     *
     * @param timeout defines how long shall the connection wait until it is killed
     * @param dbUser user under which we kill connections
     * @param conn - connection. If not provided, the default connection (from the MySqlUtil constructor) will be used.
     * @returns number of killed connections.
     */
    killZombieConnections(timeout: any, dbUser: any, conn?: mysql.Pool): Promise<number>;
}
//# sourceMappingURL=mysql-util.d.ts.map