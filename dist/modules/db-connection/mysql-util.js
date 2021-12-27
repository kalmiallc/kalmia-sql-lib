"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlUtil = void 0;
const kalmia_common_lib_1 = require("kalmia-common-lib");
const SqlString = require("sqlstring");
/**
 * MySQL helper. This helper is designed for usage of SQL connection pool.
 */
class MySqlUtil {
    constructor(dbConnection) {
        this._dbConnectionPool = dbConnection;
        return this;
    }
    /**
     * Set active connection (pool connection)
     */
    setActiveConnection(ac) {
        this._currentPooledConnection = ac;
    }
    /**
     * Get active connection (pool connection)
     */
    getActiveConnection() {
        return this._currentPooledConnection;
    }
    /**
     * Release active connection (pool connection)
     */
    releaseActiveConnection() {
        this._currentPooledConnection.release();
    }
    /**
     * Call single stored procedure inside transaction, and make commit.
     * In case of error the transaction is rolled back.
     *
     * @param procedure name of procedure
     * @param data procedure parameters
     * @param [options={multiSet: boolean}] additional options
     */
    async callSingle(procedure, data, options = {}) {
        const conn = await this.start();
        try {
            const result = await this.call(procedure, data, conn, options);
            await this.commit(conn);
            return result;
        }
        catch (err) {
            await this.rollback(conn);
            throw err;
        }
    }
    /**
     * Call stored procedure on database
     *
     * @param procedure procedure name
     * @param data Object with call parameters
     * @returns array of results from database
     */
    async call(procedure, data, connection = this._currentPooledConnection, options = {}) {
        let isSingleTrans = false;
        if (!connection) {
            isSingleTrans = true;
            connection = await this._dbConnectionPool.getConnection();
        }
        if (!connection) {
            throw Error('MySql Db Connection not provided');
        }
        const query = `CALL ${procedure}(${Object.keys(data).length ? Array(Object.keys(data).length).fill('?').join(',') : ''});`;
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'call', 'DB ', query);
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'call', 'DB ', this.mapValues(data, true).join(';'));
        const result = await connection.query(query, this.mapValues(data));
        if (isSingleTrans) {
            connection.release();
        }
        for (const resultSet of result[0]) {
            if (resultSet.length && resultSet[0].ErrorCode > 0) {
                throw new Error(`${resultSet[0].ErrorCode}: '${resultSet[0].Message}'`);
                // throw new CodeException({
                //   status: 500,
                //   code: resultSet[0].ErrorCode,
                //   errorMessage: resultSet[0].Message,
                //   details: result
                // });
            }
        }
        if (!options.multiSet) {
            return result[0][0];
        }
        else {
            return result[0];
        }
    }
    /**
     * Call stored procedure on database
     *
     * @param procedure procedure name
     * @param data Object with call parameters
     * @returns array of results from database
     */
    async callDirect(procedure, data, options = {}) {
        const query = `CALL ${procedure}(${Object.keys(data).length ? Array(Object.keys(data).length).fill('?').join(',') : ''});`;
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'callDirect', 'DB ', query);
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'callDirect', 'DB ', this.mapValues(data, true).join(';'));
        const result = await this._dbConnectionPool.query(query, this.mapValues(data));
        for (const resultSet of result[0]) {
            if (resultSet.length && resultSet[0].ErrorCode > 0) {
                throw new Error(`${resultSet[0].ErrorCode}: '${resultSet[0].Message}'`);
                // throw new CodeException({
                //   status: 500,
                //   code: resultSet[0].ErrorCode,
                //   errorMessage: resultSet[0].Message,
                //   details: result
                // });
            }
        }
        if (!options.multiSet) {
            return result[0][0];
        }
        else {
            return result[0];
        }
    }
    /**
     * This function takes a new connection form the poll and starts transaction.
     *
     * @returns connection from the pool.
     */
    async start() {
        // await this.db.query('SET SESSION autocommit = 0; START TRANSACTION;');
        const conn = await this._dbConnectionPool.getConnection();
        if (!conn) {
            throw Error('MySql Db Connection not provided');
        }
        await conn.beginTransaction();
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'start', 'DB ', 'BEGIN TRANSACTION');
        return conn;
    }
    async commit(connection = this._currentPooledConnection) {
        // await this.db.query('COMMIT; SET SESSION autocommit = 1;');
        if (!connection) {
            throw Error('MySql Db Connection not provided');
        }
        await connection.commit();
        connection.release();
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'commit', 'DB ', 'COMMIT TRANSACTION');
    }
    async rollback(connection = this._currentPooledConnection) {
        // await this.db.query('ROLLBACK; SET SESSION autocommit = 1;');
        if (!connection) {
            throw Error('MySql Db Connection not provided');
        }
        await connection.rollback();
        connection.release();
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'rollback', 'DB ', 'ROLLBACK TRANSACTION');
    }
    /**
     * Translate properties to array of property values for procedure call
     *
     * @param data Object to translate
     * @param [logOutput=false] For logging purpose we should mask the password values
     * @returns Array of values
     */
    mapValues(data, logOutput = false) {
        const protectedFields = ['password'];
        const values = [];
        for (const i in data) {
            if (!logOutput || protectedFields.indexOf(i) < 0) {
                values.push(data[i]);
            }
            else {
                values.push('*****');
            }
        }
        return values;
    }
    /**
     * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
     * and executes prepared statement. If there is no connection added to the parameter (or no current pooled connection present on the object)
     * then a new connection will be taken from the pool and released after.
     *
     *
     * @param query SQL query
     * @param values object with replacement values
     * @param connection PoolConnection reference - needed if query is part of transaction
     */
    async paramExecute(query, values, connection = this._currentPooledConnection) {
        const sqlParamValues = [];
        let isSingleTrans = false;
        if (!connection) {
            isSingleTrans = true;
            connection = await this._dbConnectionPool.getConnection();
        }
        if (!connection) {
            throw Error('MySql Db Connection not provided');
        }
        if (values) {
            // split query to array to find right order of variables
            const queryArray = SqlString.escapeId(query)
                .split(/\n|\s/)
                .filter((x) => !!x && /@.*\b/.test(x));
            for (const word of queryArray) {
                for (const key of Object.keys(values)) {
                    // transform array values to string
                    if (Array.isArray(values[key])) {
                        values[key] = values[key].join(',') || null;
                    }
                    // regex
                    const re = new RegExp(`@${key}\\b`, 'gi');
                    if (word.match(re)) {
                        if ((0, kalmia_common_lib_1.isPlainObject)(values[key])) {
                            SqlString.escapeId(sqlParamValues.push(JSON.stringify(values[key])));
                        }
                        else {
                            SqlString.escapeId(sqlParamValues.push(values[key]));
                        }
                    }
                }
            }
            // replace keys with '?' for prepared statement
            for (const key of Object.keys(values)) {
                const re = new RegExp(`@${key}\\b`, 'gi');
                query = query.replace(re, '?');
            }
        }
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'paramExecute', 'DB ', query);
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'paramExecute', 'DB ', this.mapValues(sqlParamValues, true).join(';'));
        let result;
        // const time = process.hrtime();
        try {
            result = await connection.execute(query, sqlParamValues);
        }
        catch (err) {
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', err);
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', query);
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', sqlParamValues);
            throw err;
        }
        finally {
            if (isSingleTrans) {
                connection.release();
            }
        }
        // const diff = process.hrtime(time);
        return result[0];
    }
    /**
     * Function replaces sql query parameters with "@variable" notation with values from object {variable: replace_value}
     * This function uses automatic connection creation and release functionality of mysql lib.
     *
     * @param query SQL query
     * @param values object with replacement values
     *
     */
    async paramExecuteDirect(query, values) {
        const sqlParamValues = [];
        if (values) {
            // split query to array to find right order of variables
            const queryArray = SqlString.escapeId(query)
                .split(/\n|\s/)
                .filter((x) => !!x && /@.*\b/.test(x));
            for (const word of queryArray) {
                for (const key of Object.keys(values)) {
                    // transform array values to string
                    if (Array.isArray(values[key])) {
                        values[key] = values[key].join(',') || null;
                    }
                    // regex
                    const re = new RegExp(`@${key}\\b`, 'gi');
                    if (word.match(re)) {
                        if ((0, kalmia_common_lib_1.isPlainObject)(values[key])) {
                            SqlString.escapeId(sqlParamValues.push(JSON.stringify(values[key])));
                        }
                        else {
                            SqlString.escapeId(sqlParamValues.push(values[key]));
                        }
                    }
                }
            }
            // replace keys with '?' for prepared statement
            for (const key of Object.keys(values)) {
                const re = new RegExp(`@${key}\\b`, 'gi');
                query = query.replace(re, '?');
            }
        }
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'paramExecute', 'DB ', query);
        kalmia_common_lib_1.AppLogger.db('mysql-util.ts', 'paramExecute', 'DB ', this.mapValues(sqlParamValues, true).join(';'));
        let result;
        // const time = process.hrtime();
        try {
            result = await this._dbConnectionPool.execute(query, sqlParamValues);
        }
        catch (err) {
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', err);
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', query);
            kalmia_common_lib_1.AppLogger.error('mysql-util.ts', 'paramExecute', sqlParamValues);
            throw err;
        }
        return result[0];
    }
}
exports.MySqlUtil = MySqlUtil;
//# sourceMappingURL=mysql-util.js.map