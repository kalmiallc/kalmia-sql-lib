import * as mysqlSync from 'mysql2';
import * as mysql from 'mysql2/promise';
import { IConnectionDetails } from '../../config/interfaces';
export declare class MySqlConnManager {
    private static instance;
    private static _openConnections;
    private static _poolConnCloseListeners;
    private static _poolConnOpenListeners;
    private _connections;
    private _connectionsSync;
    private _connectionDetails;
    private _connectionSyncDetails;
    private constructor();
    /**
     * Test if connection pool is not closed
     *
     * @param mySqlConnection
     *
     * @returns
     */
    static testDirectPoolConnection(mySqlConnection: mysql.Pool): Promise<boolean>;
    /**
     * Gets MySqlConnectionManager instance
     *
     * @param conn (optional) connection to set as primary
     * @returns MySqlConnectionManager instance
     */
    static getInstance(conn?: mysql.Pool | mysql.Connection): MySqlConnManager;
    static updateEnv(newEnv: any): void;
    static addConnOpenListener(listener: (conn: mysql.PoolConnection | mysql.Connection) => void): void;
    static addConnCloseListener(listener: (conn: any) => void): void;
    private static testMySqlCon;
    private static testMySqlNoPoolConnection;
    /**
     * Provides database connection as pool assigned to identifier, defaulting to primary.
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @param config (optional) connection config
     */
    getConnection(databaseIdentifier?: string, config?: mysql.ConnectionOptions): Promise<mysql.Pool>;
    /** *
     * Re-Initializes connection
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @param config (optional) connection config
     */
    reinitializeConnection(databaseIdentifier?: string, config?: mysql.ConnectionOptions): Promise<mysql.Pool>;
    /**
     * Provides direct database connection (no pool) assigned to identifier, defaulting to primary.
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    getConnectionNoPool(databaseIdentifier?: string, config?: mysql.ConnectionOptions): Promise<mysql.Connection>;
    getActiveConnections(): any[];
    /**
     * Sets database connection to primary identifier. User should ensure primary connection is closed beforehand.
     *
     */
    setConnection(conn: mysql.Pool | mysql.Connection): mysql.Pool | mysql.Connection;
    /**
     * Primary connection in sync version. This can coexist with the async connection.
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @param config (optional) settings that can override the env settings.
     * @returns Sync connection
     */
    getConnectionSync(databaseIdentifier?: string): mysqlSync.Pool;
    reinitializeConnectionSync(databaseIdentifier?: string): mysqlSync.Pool;
    /**
     * Gets connection details for provided identifier
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @returns
     */
    getConnectionDetails(databaseIdentifier?: string): IConnectionDetails;
    /**
     * Ends primary connection (pool -- closes all connections gracefully)
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    end(databaseIdentifier?: string): Promise<any>;
    endSync(databaseIdentifier?: string): any;
    /**
     * Ensures open connection to DB
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    ensureAliveSql(databaseIdentifier?: string, conn?: mysql.PoolConnection): Promise<void>;
    private populateDetails;
    private getSslParams;
    private getMySqlNoPoolConnection;
    private getMySqlPoolConnection;
    private setDbCredentials;
    private getMySqlConnectionSync;
}
//# sourceMappingURL=mysql-conn-manager.d.ts.map