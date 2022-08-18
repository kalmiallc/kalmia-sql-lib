"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbLogger = void 0;
/* eslint-disable @typescript-eslint/no-floating-promises */
const kalmia_common_lib_1 = require("kalmia-common-lib");
const env_1 = require("../../config/env");
const mysql_util_1 = require("../db-connection/mysql-util");
/**
 * DbLogger logger extends the StandardLogger with the ability to log to the db.
 */
class DbLogger {
    constructor() { }
    get isLoggerOK() {
        return DbLogger.loggerOK;
    }
    static async init(logToConsole = true) {
        DbLogger.logToConsole = logToConsole;
        try {
            // check if logger table exists
            DbLogger.sqlInst = await mysql_util_1.MySqlUtil.init();
            DbLogger.loggerOK = true;
            const tableData = await DbLogger.sqlInst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${DbLogger.DB_TABLE_NAME}'
                              LIMIT 1;`);
            const isTable = tableData[0];
            if (isTable.length > 0 && isTable[0].TABLE_NAME === DbLogger.DB_TABLE_NAME) {
                DbLogger.loggerOK = true;
                console.log('DbLogger', 'DbLogger.ts', 'DB logger initialized for table: ' + DbLogger.DB_TABLE_NAME);
            }
            else {
                console.warn('DbLogger', 'DbLogger.ts', 'Error initializing db logger, logger table not exists:' + DbLogger.DB_TABLE_NAME);
            }
        }
        catch (error) {
            console.error('DbLogger', 'DbLogger.ts', 'Error initializing db logger: ' + error);
        }
    }
    static async clearLogs() {
        try {
            kalmia_common_lib_1.AppLogger.info('DbLogger', 'DbLogger.ts', `ClearLogs - running for retention: ${DbLogger.DB_TABLE_NAME}`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${DbLogger.DB_TABLE_NAME}\` WHERE DATEDIFF(NOW(), ts) > ${DbLogger.RETENTION};`);
            DbLogger.sqlInst.paramExecuteDirect(`DELETE FROM \`${DbLogger.DB_TABLE_NAME}\` WHERE DATEDIFF(NOW(), _createTime) > ${DbLogger.RETENTION};`);
        }
        catch (error) {
            kalmia_common_lib_1.AppLogger.error('DbLogger', 'DbLogger.ts', 'Error clearing the logger: ', DbLogger.DB_TABLE_NAME);
        }
    }
    static info(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.info(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'info', args.join(' ')).catch();
    }
    static warn(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.warn(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'warn', args.join(' ')).catch();
    }
    static debug(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.debug(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'debug', args.join(' ')).catch();
    }
    static trace(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.trace(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'trace', args.join(' ')).catch();
    }
    static error(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.error(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'error', args.join(' ')).catch();
    }
    static test(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.test(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'test', args.join(' ')).catch();
    }
    static db(fileName, methodName, ...args) {
        if (!DbLogger.loggerOK) {
            return;
        }
        if (DbLogger.logToConsole) {
            kalmia_common_lib_1.AppLogger.db(fileName, methodName, args);
        }
        void DbLogger.writeDbLog(fileName, fileName, 'db', args.join(' ')).catch();
    }
    static async writeDbLog(fileName = '', methodName = '', severity, data = '') {
        try {
            await DbLogger.sqlInst.paramExecuteDirect(`
      INSERT INTO ${DbLogger.DB_TABLE_NAME} (file, method, severity, data)
      VALUES (@fileName, @methodName, @severity, @data)
    `, { fileName, methodName, severity, data });
        }
        catch (error) {
            console.error('DbLogger', 'DbLogger.ts', 'Error writing to DB log: ', DbLogger.DB_TABLE_NAME);
        }
    }
}
exports.DbLogger = DbLogger;
DbLogger.loggerOK = false;
DbLogger.logToConsole = false;
DbLogger.DB_TABLE_NAME = env_1.env.DB_LOGGER_TABLE;
DbLogger.RETENTION = env_1.env.DB_LOGGER_RETENTION;
//# sourceMappingURL=db-logger.js.map