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
const fs = require("fs");
const kalmia_common_lib_1 = require("kalmia-common-lib");
const mysqlSync = require("mysql2");
const mysql = require("mysql2/promise");
const path = require("path");
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
     * Test if connection pool is not closed
     *
     * @param mySqlConnection
     *
     * @returns
     */
    static async testDirectPoolConnection(mySqlConnection) {
        // If connection is not defined, return true, as we ship the check
        if (!mySqlConnection || mySqlConnection === undefined || mySqlConnection === null) {
            return true;
        }
        try {
            await (mySqlConnection === null || mySqlConnection === void 0 ? void 0 : mySqlConnection.execute('SELECT 1;'));
            return true;
        }
        catch (e) {
            kalmia_common_lib_1.AppLogger.warn('mysql-conn-manager.ts', 'testDirectPoolConnection', 'Pool connection closed, it will probably be reinitialized');
            return false;
        }
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
    static updateEnv(newEnv) {
        Object.assign(env_1.env, newEnv);
    }
    static addConnOpenListener(listener) {
        MySqlConnManager._poolConnOpenListeners.push(listener);
    }
    static addConnCloseListener(listener) {
        MySqlConnManager._poolConnCloseListeners.push(listener);
    }
    static async testMySqlCon(mySqlConnection) {
        try {
            const conn = await mySqlConnection.getConnection();
            if (conn.connection.stream.readyState !== 'open') {
                await conn.release();
                throw new Error('Connection created form pool is not open!');
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
     * @param config (optional) connection config
     */
    async getConnection(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        if (!this._connections[databaseIdentifier]) {
            this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
            this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
        }
        try {
            const isAlive = await MySqlConnManager.testDirectPoolConnection(this._connections[databaseIdentifier]);
            if (!isAlive) {
                await this.reinitializeConnection(databaseIdentifier, config);
            }
        }
        catch (e) {
            console.error('Error testing connection', e);
        }
        kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getConnection', 'Returning pool connection from db manager for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(Object.assign(Object.assign({}, this._connectionDetails[databaseIdentifier]), { ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined })));
        // await this.reinitializeConnection(databaseIdentifier, config);
        return this._connections[databaseIdentifier];
    }
    /** *
     * Re-Initializes connection
     *
     * @param databaseIdentifier (optional) identifier of database connection in question
     * @param config (optional) connection config
     */
    async reinitializeConnection(databaseIdentifier = types_1.DbConnectionType.PRIMARY, config = {}) {
        this._connectionDetails[databaseIdentifier] = this.populateDetails(config);
        this._connections[databaseIdentifier] = await this.getMySqlPoolConnection(config);
        kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getConnection', 'Connection reinitialized', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(Object.assign(Object.assign({}, this._connectionDetails[databaseIdentifier]), { ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined })));
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
        kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getConnection', 'Returning no pool connection from db manager for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(Object.assign(Object.assign({}, this._connectionDetails[databaseIdentifier]), { ssl: this._connectionDetails[databaseIdentifier].ssl ? '***' : undefined })));
        return this._connections[databaseIdentifier];
    }
    getActiveConnections() {
        return MySqlConnManager._openConnections;
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
    getConnectionSync(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        if (!this._connectionsSync[databaseIdentifier]) {
            this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
            this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
        }
        return this._connectionsSync[databaseIdentifier];
    }
    reinitializeConnectionSync(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        this._connectionSyncDetails[databaseIdentifier] = this.populateDetails();
        this._connectionsSync[databaseIdentifier] = this.getMySqlConnectionSync();
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
        var _a, _b;
        if (this._connections[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'end', 'Ending connection mysql for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(Object.assign(Object.assign({}, (_b = (_a = this._connections[databaseIdentifier].pool) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.connectionConfig), this._connections[databaseIdentifier].config)));
            try {
                await this._connections[databaseIdentifier].end();
            }
            catch (e) {
                kalmia_common_lib_1.AppLogger.warn('mysql-conn-manager.ts', 'end', 'Error ending connection', e);
            }
            this._connections[databaseIdentifier] = null;
            this._connectionDetails[databaseIdentifier] = null;
            MySqlConnManager._openConnections = [];
        }
    }
    endSync(databaseIdentifier = types_1.DbConnectionType.PRIMARY) {
        var _a, _b;
        if (this._connectionsSync[databaseIdentifier]) {
            kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'end', 'Ending connection mysql sync pool for', databaseIdentifier, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(Object.assign({}, (_b = (_a = this._connectionsSync[databaseIdentifier]) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.connectionConfig)));
            this._connectionsSync[databaseIdentifier].end();
            this._connectionsSync[databaseIdentifier] = null;
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
                // ssl: this.getSslParams()
            };
        }
        return {
            database: config.database || env_1.env.MYSQL_DB,
            host: config.host || env_1.env.MYSQL_HOST,
            port: config.port || env_1.env.MYSQL_PORT,
            user: config.user || env_1.env.MYSQL_USER,
            poolSize: (config === null || config === void 0 ? void 0 : config.connectionLimit) || env_1.env.MYSQL_POOL_SIZE,
            ssl: this.getSslParams()
        };
    }
    getSslParams() {
        if (!env_1.env.MYSQL_SSL_CA_FILE) {
            return undefined;
        }
        else {
            return {
                ca: fs.readFileSync(path.resolve(process.cwd(), env_1.env.MYSQL_SSL_CA_FILE)).toString(),
                key: env_1.env.MYSQL_SSL_KEY_FILE ? fs.readFileSync(path.resolve(process.cwd(), env_1.env.MYSQL_SSL_KEY_FILE)).toString() : undefined,
                cert: env_1.env.MYSQL_SSL_CERT_FILE ? fs.readFileSync(path.resolve(process.cwd(), env_1.env.MYSQL_SSL_CERT_FILE)).toString() : undefined
            };
        }
    }
    async getMySqlNoPoolConnection(config) {
        const { user, port, host, database, password, ssl } = this.setDbCredentials(config);
        kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] SQL Connection details:', env_1.env.APP_ENV, user, port, host, database);
        let conn;
        try {
            conn = await mysql.createConnection(Object.assign(Object.assign({}, config), { host,
                port,
                database,
                password,
                user, connectTimeout: env_1.env.MYSQL_CONNECTION_TIMEOUT, debug: env_1.env.MYSQL_DEBUG, timezone: env_1.env.MYSQL_TIMEZONE, decimalNumbers: true, ssl }));
            await MySqlConnManager.testMySqlNoPoolConnection(conn);
            kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', `[DBM] Successfully created MySQL connection for ${host}:${port} | DatabaseName: ${database}`);
            MySqlConnManager._openConnections.push(conn);
            return conn;
        }
        catch (e) {
            kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlNoPoolConnection', '[DBM] Database connection failed.', e);
            conn = null;
        }
    }
    async getMySqlPoolConnection(config = {}) {
        const { user, port, host, database, password, ssl } = this.setDbCredentials(config);
        kalmia_common_lib_1.AppLogger.db('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', '[DBM] SQL Connection details:', env_1.env.APP_ENV, user, port, host, database);
        let conn;
        try {
            conn = await mysql.createPool(Object.assign(Object.assign({}, config), { host,
                port,
                database,
                password,
                user, waitForConnections: true, connectTimeout: env_1.env.MYSQL_CONNECTION_TIMEOUT, decimalNumbers: true, connectionLimit: (config === null || config === void 0 ? void 0 : config.connectionLimit) || env_1.env.MYSQL_POOL_SIZE, queueLimit: 100, timezone: env_1.env.MYSQL_TIMEZONE, ssl }));
            await MySqlConnManager.testMySqlCon(conn);
            kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Successfully created MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
            // state listeners
            conn.on('acquire', function (connection) {
                try {
                    MySqlConnManager._openConnections.push(connection);
                    MySqlConnManager._poolConnOpenListeners.forEach((listener) => listener(connection));
                }
                catch (error) {
                    kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', 'Error in adding connection', error);
                }
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', `[DBM] Connection ${connection.threadId} acquired`);
            });
            conn.on('connection', function (connection) {
                connection.execute(`set session wait_timeout=${env_1.env.MYSQL_WAIT_TIMEOUT}`);
                const timeout = connection.execute('SELECT @@wait_timeout');
                kalmia_common_lib_1.AppLogger.trace('mysql-conn-manager.ts', 'testMySqlPoolConnection', 'Connection wait timeout set to', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(timeout[0]));
            });
            conn.on('release', function (connection) {
                MySqlConnManager._poolConnCloseListeners.forEach((listener) => listener(connection));
                try {
                    const val = MySqlConnManager._openConnections.find((c) => c.threadId === connection.threadId);
                    if (val) {
                        MySqlConnManager._openConnections = MySqlConnManager._openConnections.filter((c) => c.threadId !== connection.threadId);
                    }
                }
                catch (error) {
                    kalmia_common_lib_1.AppLogger.error('mysql-conn-manager.ts', 'getMySqlLocalPoolConnection', 'Error in removing connection', error);
                }
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
        let ssl = this.getSslParams();
        // connect to test DB is APP_ENV variable is set to testing.
        if (env_1.env.APP_ENV === kalmia_common_lib_1.ApplicationEnv.TEST) {
            host = config.host || env_1.env.MYSQL_HOST_TEST;
            port = config.port || env_1.env.MYSQL_PORT_TEST;
            database = config.database || env_1.env.MYSQL_DB_TEST;
            user = config.user || env_1.env.MYSQL_USER_TEST;
            password = config.password || env_1.env.MYSQL_PASSWORD_TEST;
            ssl = undefined;
        }
        return { user, port, host, database, password, config, ssl };
    }
    getMySqlConnectionSync(config) {
        const { user, port, host, database, password, ssl } = this.setDbCredentials(config);
        const poolConfig = {
            host,
            port,
            user,
            password,
            database,
            debug: env_1.env.MYSQL_DEBUG,
            timezone: env_1.env.MYSQL_TIMEZONE,
            connectionLimit: (config === null || config === void 0 ? void 0 : config.connectionLimit) || env_1.env.MYSQL_POOL_SIZE,
            ssl
        };
        const pool = mysqlSync.createPool(poolConfig);
        kalmia_common_lib_1.AppLogger.info('mysql-conn-manager.ts', 'getMySqlConnectionSync', `[DBM] Successfully created sync type MySQL pool for  ${host}:${port} | DatabaseName: ${database}`);
        return pool;
    }
}
MySqlConnManager._openConnections = [];
MySqlConnManager._poolConnCloseListeners = [];
MySqlConnManager._poolConnOpenListeners = [];
exports.MySqlConnManager = MySqlConnManager;
//# sourceMappingURL=mysql-conn-manager.js.map