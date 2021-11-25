"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlConnManager = void 0;
/**
 * This is a global connection manager. It's purpose is to provide a single entry point for sql connections.
 * It allows only one instance, so this manager also handles connection pooling.
 *
 * Based on the environment variable setting, the connection is returned. Different strategies are used. The strategy defines how we handle connection pooling.
 * All the connection data needed is handled from the environment variables. These are defined in {@link ./../../config/env}
 *
 */
const kalmia_common_lib_1 = require("kalmia-common-lib");
const mysqlSync = require("mysql2");
const mysql = require("mysql2/promise");
const types_1 = require("../../config/types");
const env_1 = require("./../../config/env");
class MySqlConnManager {
    constructor() {
        this._connections = {};
        this._connectionsSync = {};
        this._connectionDetails = {};
        this._connectionSyncDetails = {};
    }
    /**
     * Gets MySqlConnectionManager instance
     *
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
    static async testMySqlNoPoolConnection(mySqlConnection) {
        try {
            const conn = mySqlConnection;
            if (conn.connection.stream.readyState !== 'open') {
                await conn.end();
                throw new Error('Test connection unsuccessful!');
            }
        }
        catch (e) {
            throw new Error('Test pool connection unsuccessful!, ' + e);
        }
    }
    /**
     * Provides database connection as pool assigned to identifier, defaulting to primary.
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async getConnection(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        if (!this._connections[databaseIdentifier]) {
            this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
            this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
        }
        kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getConnection', 'Returning pool connection from db manager for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier]));
        return this._connections[databaseIdentifier];
    }
    /**
     * Provides direct database connection (no pool) assigned to identifier, defaulting to primary.
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async getConnectionNoPool(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        if (!this._connections[databaseIdentifier]) {
            this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
            this._connections[databaseIdentifier] = await this.getMySqlNoPoolConnection(config);
        }
        kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getConnection', 'Returning no pool connection from db manager for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier]));
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
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @param config (optional) settings that can override the env settings.
     * @returns Sync connection
     */
    getConnectionSync(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        if (!this._connectionsSync[databaseIdentifier]) {
            this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
            this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
        }
        return this._connectionsSync[databaseIdentifier];
    }
    /**
     * Gets connection details for provided identifier
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @returns
     */
    getConnectionDetails(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        return this._connectionDetails[databaseIdentifier];
    }
    /**
     * Ends primary connection (pool -- closes all connections gracefully)
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     */
    async end(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        if (this._connectionsSync[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'end', 'Ending connection mysql sync pool for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionSyncDetails[databaseIdentifier]));
            this._connectionsSync[databaseIdentifier].end();
            this._connectionsSync[databaseIdentifier] = null;
        }
        if (this._connections[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'end', 'Ending connection mysql for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(this._connectionDetails[databaseIdentifier]));
            await this._connections[databaseIdentifier].end();
            this._connections[databaseIdentifier] = null;
            this._connectionDetails[databaseIdentifier] = null;
        }
    }
    /**
     * Ensures open connection to DB
     *
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
                poolSize: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE_TEST
            };
        }
        return {
            database: config.database || env_1.env.MYSQL_DB,
            host: config.host || env_1.env.MYSQL_HOST,
            port: config.port || env_1.env.MYSQL_PORT,
            user: config.user || env_1.env.MYSQL_USER,
            poolSize: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE
        };
    }
    async getMySqlNoPoolConnection(config) {
        const { user, port, host, database, password } = this.setDbCredentials(config);
        kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] SQL Connection details:', env_1.env.APP_ENV, user, port, host, database);
        let conn;
        try {
            conn = await mysql.createConnection(Object.assign(Object.assign({}, config), { host,
                port,
                database,
                password,
                user, connectTimeout: env_1.env.MYSQL_CONNECTION_TIMEOUT, decimalNumbers: true }));
            await MySqlConnManager.testMySqlNoPoolConnection(conn);
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', `[DBM] Successfully created MySQL connection for ${host}:${port} | DatabaseName: ${database}`);
            return conn;
        }
        catch (e) {
            kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] Database connection failed.', e);
            conn = null;
        }
    }
    async getMySqlPoolConnection(config = {}) {
        const { user, port, host, database, password } = this.setDbCredentials(config);
        kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env_1.env.APP_ENV, user, port, host, database);
        let conn;
        try {
            conn = await mysql.createPool(Object.assign(Object.assign({}, config), { host,
                port,
                database,
                password,
                user, waitForConnections: true, connectTimeout: env_1.env.MYSQL_CONNECTION_TIMEOUT, decimalNumbers: true, connectionLimit: config.connectionLimit || env_1.env.MYSQL_POOL_SIZE, queueLimit: 100 }));
            await MySqlConnManager.testMySqlPoolConnection(conn);
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
            // state listeners
            conn.on('acquire', function (connection) {
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} acquired`);
            });
            conn.on('connection', function (connection) {
                connection.execute(`set session wait_timeout=${env_1.env.MYSQL_WAIT_TIMEOUT}`);
                const timeout = connection.execute('SELECT @@wait_timeout');
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'testMySqlPoolConnection', 'Connection wait timeout set to', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(timeout[0]));
            });
            conn.on('release', function (connection) {
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} release`);
            });
            conn.on('enqueue', function () {
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Waiting for available connection slot');
            });
            return conn;
        }
        catch (e) {
            kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] Database connection failed.', e);
            conn = null;
        }
    }
    setDbCredentials(config) {
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
        return { user, port, host, database, password, config };
    }
    getMySqlConnectionSync(config) {
        const { user, port, host, database, password } = this.setDbCredentials(config);
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
        kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlConnectionSync', `[DBM] Successfully created sync type MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
        return pool;
    }
}
exports.MySqlConnManager = MySqlConnManager;
//# sourceMappingURL=mysql-conn-manager.js.map