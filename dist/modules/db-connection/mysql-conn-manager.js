"use strict";
/**
 * This is a global connection manager. It's purpose is to provide a single entry point for all types of connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 *
 *
 * TODO: Add options to control the connection from the AWS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlConnManager = void 0;
const kalmia_common_lib_1 = require("kalmia-common-lib");
const mysqlSync = require("mysql2");
const mysql = require("mysql2/promise");
const env_1 = require("../../config/env");
const types_1 = require("../../config/types");
class MySqlConnManager {
    constructor() {
        this._connections = {};
        this._connectionsSync = {};
        this._connectionDetails = {};
        this._connectionSyncDetails = {};
    }
    /**
     * Gets MySqlConnectionManager instance
     * @param conn (optional) connection to set as primary
     * @returns MySqlConnectionManager instance
     */
    static getInstance(conn) {
        if (!MySqlConnManager.instance) {
            MySqlConnManager.instance = new MySqlConnManager();
        }
        if (conn) {
            MySqlConnManager.instance.setConnection(conn);
        }
        return MySqlConnManager.instance;
    }
    static async testMySqlPoolConnection(mySqlConnection) {
        try {
            const conn = await mySqlConnection.getConnection();
            if (conn.connection.stream.readyState !== 'open') {
                await conn.release();
                throw new Error('Test pool connection unsuccessful!');
            }
            await conn.release();
        }
        catch (e) {
            throw new Error('Test pool connection unsuccessful!, ' + e);
        }
    }
    /**
     * Provides database connection assigned to identifier, defaulting to primary.
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async getConnection(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        if (!this._connections[databaseIdentifier]) {
            this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
            this._connections[databaseIdentifier] = await this.getMySqlConnection(config);
        }
        return this._connections[databaseIdentifier];
    }
    /**
     * Sets database connection to primary identifier. User should ensure primary connection is closed beforehand.
     *
     */
    setConnection(conn) {
        this._connectionDetails[types_1.DbConnectionType.PRIMARY] = { database: types_1.DbConnectionType.PRIMARY };
        this._connections[types_1.DbConnectionType.PRIMARY] = conn;
        return this._connections[types_1.DbConnectionType.PRIMARY];
    }
    /**
     * Primary connection in sync version. This can coexist with the async connection.
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    getConnectionSync(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        if (!this._connectionsSync[databaseIdentifier]) {
            this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
            this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
        }
        return this._connectionsSync[databaseIdentifier];
    }
    /**
     * Gets connection details for provided identifier
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @returns
     */
    getConnectionDetails(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        return this._connectionDetails[databaseIdentifier];
    }
    /**
     * Ends primary connection (pool -- closes all connections gracefully)
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async end(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        if (this._connectionsSync[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'end', 'Ending connection mysql sync pool', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier]));
            this._connectionsSync[databaseIdentifier].end();
            delete this._connectionsSync[databaseIdentifier];
        }
        if (this._connections[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'end', 'Ending connection mysql pool', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionSyncDetails[databaseIdentifier]));
            await this._connections[databaseIdentifier].end();
            delete this._connections[databaseIdentifier];
            delete this._connectionDetails[databaseIdentifier];
        }
    }
    /**
     * Ensures open connection to DB
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async ensureAliveSql(databaseIdentifier = types_1.DbConnectionType.PRIMARY, conn) {
        if (!this._connections[databaseIdentifier]) {
            await this._connections[databaseIdentifier].connect();
            return;
        }
        try {
            if (!conn) {
                conn = await this._connections[databaseIdentifier].getConnection();
            }
            if (!conn || conn.connection.stream.readyState !== 'open') {
                this._connections[databaseIdentifier] = undefined;
                await this._connections[databaseIdentifier].connect();
            }
        }
        catch (err) {
            this._connections[databaseIdentifier] = undefined;
            await this._connections[databaseIdentifier].connect();
        }
    }
    populateDetails(config = {}) {
        if (process.env.APP_ENV === kalmia_common_lib_1.ApplicationEnv.TEST) {
            return {
                database: config.database || env_1.env.MYSQL_DB_TEST,
                host: config.host || env_1.env.MYSQL_HOST_TEST,
                port: config.port || env_1.env.MYSQL_PORT_TEST,
                user: config.user || env_1.env.MYSQL_USER_TEST,
                poolSize: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE_TEST,
                strategy: types_1.ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || types_1.ConnectionStrategy.LOCAL_POOL
            };
        }
        return {
            database: config.database || env_1.env.MYSQL_DB,
            host: config.host || env_1.env.MYSQL_HOST,
            port: config.port || env_1.env.MYSQL_PORT,
            user: config.user || env_1.env.MYSQL_USER,
            poolSize: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE,
            strategy: types_1.ConnectionStrategy[process.env.MYSQL_CONN_STRATEGY] || types_1.ConnectionStrategy.LOCAL_POOL
        };
    }
    async getMySqlConnection(config = {}) {
        return await this.getMySqlLocalPoolConnection(config);
        // TODO: Handle AWS RDS, no poll....
    }
    async getMySqlLocalPoolConnection(config = {}) {
        if (!config) {
            config = {};
        }
        let host = config.host || env_1.env.MYSQL_HOST;
        let port = config.port || env_1.env.MYSQL_PORT;
        let database = config.database || env_1.env.MYSQL_DB;
        let user = config.user || env_1.env.MYSQL_USER;
        let password = config.password || env_1.env.MYSQL_PASSWORD;
        // connect to test DB is APP_ENV variable is set to testing.
        if (env_1.env.APP_ENV === kalmia_common_lib_1.ApplicationEnv.TEST) {
            host = config.host || env_1.env.MYSQL_HOST_TEST;
            port = config.port || env_1.env.MYSQL_PORT_TEST;
            database = config.database || env_1.env.MYSQL_DB_TEST;
            user = config.user || env_1.env.MYSQL_USER_TEST;
            password = config.password || env_1.env.MYSQL_PASSWORD_TEST;
        }
        kalmia_common_lib_1.AppLogger.debug('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env_1.env.APP_ENV, user, port, host, database);
        let conn;
        try {
            conn = await mysql.createPool({
                host,
                port,
                database,
                password,
                user,
                waitForConnections: true,
                decimalNumbers: true,
                connectionLimit: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE,
                queueLimit: 100
            });
            await MySqlConnManager.testMySqlPoolConnection(conn);
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
            return conn;
        }
        catch (e) {
            kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Database connection failed.', e);
            conn = null;
        }
    }
    getMySqlConnectionSync() {
        let host = env_1.env.MYSQL_HOST;
        let port = env_1.env.MYSQL_PORT;
        let database = env_1.env.MYSQL_DB;
        let user = env_1.env.MYSQL_USER;
        let password = env_1.env.MYSQL_PASSWORD;
        // connect to test DB is APP_ENV variable is set to testing.
        if (env_1.env.APP_ENV === kalmia_common_lib_1.ApplicationEnv.TEST) {
            host = env_1.env.MYSQL_HOST_TEST;
            port = env_1.env.MYSQL_PORT_TEST;
            database = env_1.env.MYSQL_DB_TEST;
            user = env_1.env.MYSQL_USER_TEST;
            password = env_1.env.MYSQL_PASSWORD_TEST;
        }
        const poolConfig = {
            host,
            port,
            user,
            password,
            database,
            // debug: true,
            connectionLimit: 10
        };
        const pool = mysqlSync.createPool(poolConfig);
        kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlConnectionSync', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
        return pool;
    }
}
exports.MySqlConnManager = MySqlConnManager;
//# sourceMappingURL=mysql-conn-manager.js.map