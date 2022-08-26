"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbLogger = void 0;
/* eslint-disable @typescript-eslint/no-floating-promises */
const kalmia_common_lib_1 = require("kalmia-common-lib");
const env_1 = require("../../config/env");
const types_1 = require("../../config/types");
const mysql_util_1 = require("../db-connection/mysql-util");
class DbLogger {
    constructor() { }
    /**
     * Ends the connection to DB.
     */
    static async end() {
        await DbLogger.sqlInst.end();
    }
    static async init() {
        try {
            DbLogger.sqlInst = await mysql_util_1.MySqlUtil.init();
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', 'Logger connection initialized');
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error initializing db logger: ' + error);
        }
    }
    static async checkIfDbLoggerInitialized() {
        if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
            await DbLogger.init();
        }
        if (DbLogger.sqlInst.getConnectionPool().pool._closed) {
            await DbLogger.init();
        }
        if (!DbLogger.loggerOK) {
            await DbLogger.checkIfLogDbExists(env_1.env.DB_LOGGER_TABLE);
        }
    }
    static async checkIfWorkerLoggerInitialized() {
        if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
            await DbLogger.init();
        }
        if (!DbLogger.workerLoggerOK) {
            await DbLogger.checkIfLogDbExists(env_1.env.DB_LOGGER_WORKER_TABLE);
        }
    }
    static async checkIfRequestLoggerInitialized() {
        if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
            await DbLogger.init();
        }
        if (!DbLogger.requestLoggerOK) {
            await DbLogger.checkIfLogDbExists(env_1.env.DB_LOGGER_REQUEST_TABLE);
        }
    }
    static async checkIfLogDbExists(table) {
        if (DbLogger.sqlInst === undefined || DbLogger.sqlInst === null) {
            await DbLogger.init();
        }
        if (!DbLogger.sqlInst.getConnectionPool()) {
            kalmia_common_lib_1.AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error for logger existence check , no connection pool');
            return;
        }
        const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${table}'
                              LIMIT 1;`);
        const isTable = tableData[0];
        if (isTable.length > 0 && isTable[0].TABLE_NAME === table) {
            switch (table) {
                case env_1.env.DB_LOGGER_TABLE:
                    DbLogger.loggerOK = true;
                    break;
                case env_1.env.DB_LOGGER_WORKER_TABLE:
                    DbLogger.workerLoggerOK = true;
                    break;
                case env_1.env.DB_LOGGER_REQUEST_TABLE:
                    DbLogger.requestLoggerOK = true;
                    break;
                default:
                    break;
            }
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + table);
        }
        else {
            kalmia_common_lib_1.AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + table);
        }
    }
    static async clearStandardLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearStandardLogs - running for retention: ${env_1.env.DB_LOGGER_RETENTION}`);
            await DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), ts) >= ${env_1.env.DB_LOGGER_RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearStandardLogs the logger: ', env_1.env.DB_LOGGER_TABLE);
        }
    }
    static async clearWorkerLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearWorkerLogs - running for retention: ${env_1.env.DB_LOGGER_WORKER_RETENTION}`);
            await DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), ts) >= ${env_1.env.DB_LOGGER_WORKER_RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearWorkerLogs the logger: ', env_1.env.DB_LOGGER_WORKER_TABLE);
        }
    }
    static async clearRequestLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearRequestLogs - running for retention: ${env_1.env.DB_LOGGER_REQUEST_RETENTION}`);
            await DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) >= ${env_1.env.DB_LOGGER_REQUEST_RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearing the clearRequestLogs logger: ', env_1.env.DB_LOGGER_REQUEST_TABLE);
        }
    }
    static info(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.info(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'info', args.join(' ')).catch();
    }
    static warn(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.warn(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'warn', args.join(' ')).catch();
    }
    static debug(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.debug(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'debug', args.join(' ')).catch();
    }
    static trace(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.trace(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'trace', args.join(' ')).catch();
    }
    static error(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.error(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'error', args.join(' ')).catch();
    }
    static test(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.test(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'test', args.join(' ')).catch();
    }
    static db(fileName, methodName, ...args) {
        if (env_1.env.DB_LOGGER_LOG_TO_CONSOLE === 1) {
            kalmia_common_lib_1.AppLogger.db(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'db', args.join(' ')).catch();
    }
    /**
     * Async version for writing to db log.
     */
    static async writeDbLog(fileName = '', methodName = '', severity, data = '') {
        try {
            await DbLogger.checkIfDbLoggerInitialized();
            if (!DbLogger.loggerOK) {
                return;
            }
            await DbLogger.sqlInst.paramExecuteDirect(`
      INSERT INTO ${env_1.env.DB_LOGGER_TABLE} (file, method, severity, data)
      VALUES (@fileName, @methodName, @severity, @data)
    `, { fileName, methodName, severity, data });
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', error);
        }
    }
    /**
     * Write log to database
     *
     * @param status worker status
     * @param message message
     * @param worker worker name
     * @param data any data in JSON
     * @param err Error object
     */
    static logWorker(status, worker, message, data, err, uuid) {
        DbLogger.logWorkerAsync(status, worker, message, data, err, uuid).catch();
    }
    /**
     * Write request to database log. Function is sync, and will not fail in case of an error. There is no control on the actual write.
     *
     * @param data RequestLogData
     */
    static logRequest(data) {
        DbLogger.logRequestAsync(data).catch();
    }
    /**
     * Async version of logRRequest
     */
    static async logRequestAsync(inputData) {
        try {
            if (env_1.env.DB_LOGGER_REQUEST_LOG_TO_CONSOLE === 1) {
                kalmia_common_lib_1.AppLogger.info('Request Log', inputData.method, kalmia_common_lib_1.AppLogger.stringifyObjectForLog(inputData));
            }
            await DbLogger.checkIfRequestLoggerInitialized();
            if (!DbLogger.requestLoggerOK) {
                return;
            }
            if (inputData.data) {
                if (typeof inputData.data !== 'object') {
                    inputData.data = { data: inputData.data };
                }
            }
            else {
                inputData.data = {};
            }
            await DbLogger.sqlInst.paramExecuteDirect(`
      INSERT INTO ${env_1.env.DB_LOGGER_REQUEST_TABLE} (host, ip, statusCode, method, url, endpoint, userAgent, origin, xForwardedFor, body, responseTime, data)
      VALUES (@host, @ip, @statusCode, @method, @url, @endpoint, @userAgent, @origin, @xForwardedFor, @body, @responseTime, @data)
    `, {
                host: inputData.host || '',
                ip: inputData.ip || '',
                statusCode: inputData.statusCode || 0,
                method: inputData.method || '',
                url: inputData.url || '',
                endpoint: inputData.endpoint || '',
                userAgent: inputData.userAgent || '',
                origin: inputData.origin || '',
                xForwardedFor: inputData.xForwardedFor || '',
                body: inputData.body || '',
                responseTime: inputData.responseTime || 0,
                data: inputData.data
            });
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to request DB log: ', error);
        }
    }
    /**
     * Async version of logWorker
     */
    static async logWorkerAsync(status, worker, message, data, err, uuid) {
        try {
            if (env_1.env.DB_LOGGER_WORKER_TO_CONSOLE === 1) {
                kalmia_common_lib_1.AppLogger.info('Worker Log', worker, status, message, data, err);
            }
            await DbLogger.checkIfWorkerLoggerInitialized();
            if (!DbLogger.workerLoggerOK) {
                return;
            }
            let error = {};
            if (err) {
                status = types_1.WorkerLogStatus.ERROR;
                error = { message: err.message, stack: err.stack };
            }
            if (typeof data !== 'object') {
                data = { data };
            }
            await DbLogger.sqlInst.paramExecuteDirect(`
	      INSERT INTO ${env_1.env.DB_LOGGER_WORKER_TABLE} (status, worker, message, data, error, uuid)
	      VALUES (@status, @worker, @message, @data, @error, @uuid)
	    `, { status, worker, message, data, error, uuid: uuid || '' });
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing worker log to DB: ', error);
        }
    }
}
exports.DbLogger = DbLogger;
DbLogger.loggerOK = false;
DbLogger.workerLoggerOK = false;
DbLogger.requestLoggerOK = false;
//# sourceMappingURL=db-logger.js.map