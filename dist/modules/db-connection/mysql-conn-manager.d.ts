/**
 * This is a global connection manager. It's purpose is to provide a single entry point for sql connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 */
import * as mysqlSync from 'mysql2';
import * as mysql from 'mysql2/promise';
import { IConnectionDetails } from '../../config/interfaces';
export declare class MySqlConnManager {
    private static instance;
    private _connections;
    private _connectionsSync;
    private _connectionDetails;
    private _connectionSyncDetails;
    private constructor();
    /**
     * Gets MySqlConnectionManager instance
     * @param conn (optional) connection to set as primary
     * @returns MySqlConnectionManager instance
     */
    static getInstance(conn?: mysql.Pool | mysql.Connection): MySqlConnManager;
    private static testMySqlPoolConnection;
    /**
     * Provides database connection assigned to identifier, defaulting to primary.
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    getConnection(databaseIdentifier?: string, config?: mysql.ConnectionOptions): Promise<mysql.Pool | mysql.Connection>;
    /**
     * Sets database connection to primary identifier. User should ensure primary connection is closed beforehand.
     *
     */
    setConnection(conn: mysql.Pool | mysql.Connection): mysql.Pool | mysql.Connection;
    /**
     * Primary connection in sync version. This can coexist with the async connection.
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    getConnectionSync(databaseIdentifier?: string): mysqlSync.Pool;
    /**
     * Gets connection details for provided identifier
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @returns
     */
    getConnectionDetails(databaseIdentifier?: string): IConnectionDetails;
    /**
     * Ends primary connection (pool -- closes all connections gracefully)
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    end(databaseIdentifier?: string): Promise<any>;
    /**
     * Ensures open connection to DB
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    ensureAliveSql(databaseIdentifier?: string, conn?: mysql.PoolConnection): Promise<void>;
    private populateDetails;
    private getMySqlConnection;
    private getMySqlLocalPoolConnection;
    private getMySqlConnectionSync;
}
//# sourceMappingURL=mysql-conn-manager.d.ts.map