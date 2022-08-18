import { AppLogger } from 'kalmia-common-lib';
import { env } from '../../../config/env';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { MigrationHelper } from '../../test-helpers/migrations';
import { DbLogger } from '../db-logger';
import { MySqlUtil } from './../../db-connection/mysql-util';

// We need this for some strange mysql lib encoding issue. See: https://stackoverflow.com/questions/46227783/encoding-not-recognized-in-jest-js
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('iconv-lite').encodingExists('foo');

describe('DB Logger tests', () => {
  beforeAll(async () => {
    await MigrationHelper.upgradeDatabase();
    const inst = await MySqlUtil.init();
    const tableData = await inst.getConnectionPool().query(`SELECT * 
                              FROM information_schema.tables
                              WHERE table_name = '${env.DB_LOGGER_TABLE}'
                              LIMIT 1;`);
    const isTable = tableData[0] as any;
    expect(isTable.length > 0).toBeTruthy();
    expect(isTable[0].TABLE_NAME).toBe(env.DB_LOGGER_TABLE);
  });

  afterAll(async () => {
    await MigrationHelper.downgradeDatabase();
  });
  afterEach(async () => {
    const inst = await MySqlUtil.init();
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_TABLE}`);
    await MySqlConnManager.getInstance().end();
  });
  it('Logger info message', async () => {
    await DbLogger.init();
    const testMessage = 'Test message';
    const testMessage2 = 'Test message 2';
    DbLogger.info('TestMethod', 'Logger.test.ts', testMessage, testMessage2);
    // add some wait as we are not sure when the logger will be written
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    AppLogger.test('TestMethod', 'Logger.test.ts', AppLogger.stringifyObjectForLog(data[0]));
    expect(data[0].severity).toBe('info');
    expect(data[0].ts).toBeTruthy();
    expect(data[0].data).toBeTruthy();
    expect(data[0].data).toBe(testMessage + ' ' + testMessage2);
  });

  it('Logger different severities', async () => {
    await DbLogger.init();
    DbLogger.error('TestMethod', 'Logger.test.ts', 'Error level log');
    DbLogger.warn('TestMethod', 'Logger.test.ts', 'Warn level log');
    DbLogger.info('TestMethod', 'Logger.test.ts', 'Info level log');
    DbLogger.debug('TestMethod', 'Logger.test.ts', 'Debug level log');
    DbLogger.trace('TestMethod', 'Logger.test.ts', 'Trace level log');
    DbLogger.test('TestMethod', 'Logger.test.ts', 'Test level log');
    DbLogger.db('TestMethod', 'Logger.test.ts', 'Db level log');
    // add some wait as we are not sure when the logger will be written
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    AppLogger.test('TestMethod', 'Logger.test.ts', AppLogger.stringifyObjectForLog(data[0]));
    expect(data.length).toBe(7);
    expect(data[0].severity).toBe('error');
    expect(data[0].ts).toBeTruthy();
    expect(data[0].data).toBeTruthy();
  });
});
