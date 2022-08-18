"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kalmia_common_lib_1 = require("kalmia-common-lib");
const env_1 = require("../../../config/env");
const mysql_conn_manager_1 = require("../../db-connection/mysql-conn-manager");
const migrations_1 = require("../../test-helpers/migrations");
const db_logger_1 = require("../db-logger");
const mysql_util_1 = require("./../../db-connection/mysql-util");
// We need this for some strange mysql lib encoding issue. See: https://stackoverflow.com/questions/46227783/encoding-not-recognized-in-jest-js
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('iconv-lite').encodingExists('foo');
describe('DB Logger tests', () => {
    beforeAll(async () => {
        await migrations_1.MigrationHelper.upgradeDatabase();
        const inst = await mysql_util_1.MySqlUtil.init();
        const tableData = await inst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${env_1.env.DB_LOGGER_TABLE}'
                              LIMIT 1;`);
        const isTable = tableData[0];
        expect(isTable.length > 0).toBeTruthy();
        expect(isTable[0].TABLE_NAME).toBe(env_1.env.DB_LOGGER_TABLE);
    });
    afterAll(async () => {
        await migrations_1.MigrationHelper.downgradeDatabase();
        await db_logger_1.DbLogger.end();
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end();
    });
    afterEach(async () => {
        const inst = await mysql_util_1.MySqlUtil.init();
        await inst.getConnectionPool().query(`DELETE FROM ${env_1.env.DB_LOGGER_TABLE}`);
    });
    it('Logger info message', async () => {
        const testMessage = 'Test message';
        const testMessage2 = 'Test message 2';
        db_logger_1.DbLogger.info('TestMethod', 'Logger.test.ts', testMessage, testMessage2);
        // add some wait as we are not sure when the logger will be written
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const inst = await mysql_util_1.MySqlUtil.init();
        const data = await inst.paramExecuteDirect(`SELECT * FROM ${env_1.env.DB_LOGGER_TABLE}`);
        db_logger_1.DbLogger.test('TestMethod', 'Logger.test.ts', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(data[0]));
        expect(data[0].severity).toBe('info');
        expect(data[0].ts).toBeTruthy();
        expect(data[0].data).toBeTruthy();
        expect(data[0].data).toBe(testMessage + ' ' + testMessage2);
    });
    it('Logger different severities', async () => {
        env_1.env.DB_LOGGER_LOG_TO_CONSOLE = 1;
        db_logger_1.DbLogger.error('TestMethod', 'Logger.test.ts', 'Error level log');
        db_logger_1.DbLogger.warn('TestMethod', 'Logger.test.ts', 'Warn level log');
        env_1.env.DB_LOGGER_LOG_TO_CONSOLE = 0;
        db_logger_1.DbLogger.info('TestMethod', 'Logger.test.ts', 'Info level log');
        db_logger_1.DbLogger.debug('TestMethod', 'Logger.test.ts', 'Debug level log');
        db_logger_1.DbLogger.trace('TestMethod', 'Logger.test.ts', 'Trace level log');
        db_logger_1.DbLogger.test('TestMethod', 'Logger.test.ts', 'Test level log');
        db_logger_1.DbLogger.db('TestMethod', 'Logger.test.ts', 'Db level log');
        // add some wait as we are not sure when the logger will be written
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const inst = await mysql_util_1.MySqlUtil.init();
        const data = await inst.paramExecuteDirect(`SELECT * FROM ${env_1.env.DB_LOGGER_TABLE}`);
        db_logger_1.DbLogger.test('TestMethod', 'Logger.test.ts', kalmia_common_lib_1.AppLogger.stringifyObjectForLog(data[0]));
        expect(data.length).toBe(7);
        expect(data[0].severity).toBe('error');
        expect(data[0].ts).toBeTruthy();
        expect(data[0].data).toBeTruthy();
    });
});
//# sourceMappingURL=db-logger.test.js.map