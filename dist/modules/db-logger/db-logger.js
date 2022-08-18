"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbLogger = void 0;
/* eslint-disable @typescript-eslint/no-floating-promises */
const kalmia_common_lib_1 = require("kalmia-common-lib");
const env_1 = require("../../config/env");
const mysql_util_1 = require("../db-connection/mysql-util");
class DbLogger {
    constructor() { }
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
            await DbLogger.checkIfLogDbExists(env_1.env.DB_LOGGER_WORKER_TABLE);
        }
    }
    static async checkIfLogDbExists(table) {
        const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${table}'
                              LIMIT 1;`);
        const isTable = tableData[0];
        if (isTable.length > 0 && isTable[0].TABLE_NAME === table) {
            DbLogger.loggerOK = true;
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + table);
        }
        else {
            kalmia_common_lib_1.AppLogger.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + table);
        }
    }
    static async clearStandardLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearStandardLogs - running for retention: ${env_1.env.DB_LOGGER_TABLE}`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env_1.env.DB_LOGGER_RETENTION};`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env_1.env.DB_LOGGER_RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearStandardLogs the logger: ', env_1.env.DB_LOGGER_TABLE);
        }
    }
    static async clearWorkerLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearWorkerLogs - running for retention: ${env_1.env.DB_LOGGER_WORKER_TABLE}`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env_1.env.DB_LOGGER_WORKER_RETENTION};`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_WORKER_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env_1.env.DB_LOGGER_WORKER_RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearWorkerLogs the logger: ', env_1.env.DB_LOGGER_WORKER_TABLE);
        }
    }
    static async clearRequestLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `clearRequestLogs - running for retention: ${env_1.env.DB_LOGGER_REQUEST_TABLE}`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), ts) > ${env_1.env.DB_LOGGER_REQUEST_RETENTION};`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${env_1.env.DB_LOGGER_REQUEST_TABLE}\` WHERE DATEDIFF(NOW(), _createTime) > ${env_1.env.DB_LOGGER_REQUEST_RETENTION};`);
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
        if (!DbLogger.loggerOK) {
            return;
        }
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
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', env_1.env.DB_LOGGER_TABLE);
        }
    }
    static async writeWorkerLog(fileName = '', methodName = '', severity, data = '') { }
    static async writeRequestLog(data) {
        try {
            await DbLogger.checkIfRequestLoggerInitialized();
            if (!DbLogger.requestLoggerOK) {
                return;
            }
            await DbLogger.sqlInst.paramExecuteDirect(`
      INSERT INTO ${env_1.env.DB_LOGGER_TABLE} (file, method, severity, data)
      VALUES (@host, @ip, @statusCode, @method, @url, @endpoint, @userAgent, @origin, @xForwardedFor, @body, @responseTime)
    `, {
                host: data.host,
                ip: data.ip,
                statusCode: data.statusCode,
                method: data.method,
                url: data.url,
                endpoint: data.endpoint,
                userAgent: data.userAgent,
                origin: data.origin,
                xForwardedFor: data.xForwardedFor,
                body: data.body,
                responseTime: data.responseTime
            });
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', env_1.env.DB_LOGGER_TABLE);
        }
    }
}
exports.DbLogger = DbLogger;
DbLogger.loggerOK = false;
DbLogger.workerLoggerOK = false;
DbLogger.requestLoggerOK = false;
//# sourceMappingURL=db-logger.js.map