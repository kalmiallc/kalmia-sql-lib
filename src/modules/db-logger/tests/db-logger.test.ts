import { AppLogger } from 'kalmia-common-lib';
import { env } from '../../../config/env';
import { WorkerLogStatus } from '../../../config/types';
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
    await DbLogger.end();
    await MySqlConnManager.getInstance().end();
  });
  afterEach(async () => {
    const inst = await MySqlUtil.init();
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_TABLE}`);
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_REQUEST_TABLE}`);
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_WORKER_TABLE}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('Logger info message', async () => {
    const testMessage = 'Test message';
    const testMessage2 = 'Test message 2';
    DbLogger.info('TestMethod', 'Logger.test.ts', testMessage, testMessage2);
    // add some wait as we are not sure when the logger will be written
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    DbLogger.test('TestMethod', 'Logger.test.ts', AppLogger.stringifyObjectForLog(data[0]));
    expect(data[0].severity).toBe('info');
    expect(data[0].ts).toBeTruthy();
    expect(data[0].data).toBeTruthy();
    expect(data[0].data).toBe(testMessage + ' ' + testMessage2);
  });

  it('Logger different severities', async () => {
    env.DB_LOGGER_LOG_TO_CONSOLE = 1;
    DbLogger.error('TestMethod', 'Logger.test.ts', 'Error level log');
    DbLogger.warn('TestMethod', 'Logger.test.ts', 'Warn level log');
    env.DB_LOGGER_LOG_TO_CONSOLE = 0;
    DbLogger.info('TestMethod', 'Logger.test.ts', 'Info level log');
    DbLogger.debug('TestMethod', 'Logger.test.ts', 'Debug level log');
    DbLogger.trace('TestMethod', 'Logger.test.ts', 'Trace level log');
    DbLogger.test('TestMethod', 'Logger.test.ts', 'Test level log');
    DbLogger.db('TestMethod', 'Logger.test.ts', 'Db level log');
    // add some wait as we are not sure when the logger will be written
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    DbLogger.test('TestMethod', 'Logger.test.ts', AppLogger.stringifyObjectForLog(data[0]));
    expect(data.length).toBe(7);
    expect(data[0].severity).toBe('error');
    expect(data[0].ts).toBeTruthy();
    expect(data[0].data).toBeTruthy();
  });

  it('Log worker', async () => {
    DbLogger.logWorker(WorkerLogStatus.START, 'Test worker', 'Start processing job document...');
    await new Promise((resolve) => setTimeout(resolve, 500));
    DbLogger.logWorker(WorkerLogStatus.INFO, 'Test worker', 'Now we are here...', { a: 1, b: 2 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    DbLogger.logWorker(WorkerLogStatus.ERROR, 'Test worker', 'Now we have error', { a: 1, b: 2 }, new Error('Test error'));
    await new Promise((resolve) => setTimeout(resolve, 500));
    DbLogger.logWorker(WorkerLogStatus.SUCCESS, 'Test worker', 'Worker finished successfully', null, null, 'uuid21233uuid');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_WORKER_TABLE}`);
    expect(data.length).toBe(4);
    expect(data[0].status).toBe('start');
    expect(data[0].worker).toBe('Test worker');
    expect(data[0].message).toBe('Start processing job document...');
    expect(data[1].data).toEqual({ a: 1, b: 2 });
    expect(data[2].error.message).toBe('Test error');
    expect(data[3].uuid).toBe('uuid21233uuid');
  });

  it('Log request', async () => {
    DbLogger.logRequest({
      method: 'GET',
      host: 'myhost',
      ip: '123.123.123',
      statusCode: 200,
      url: 'http://myhost/mypath',
      endpoint: 'myEndpoint',
      userAgent: 'myUserAgent',
      origin: 'myOrigin',
      xForwardedFor: 'myXForwardedFor',
      body: 'myBody',
      responseTime: 500
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    DbLogger.logRequest({
      method: 'GET',
      host: 'myhost',
      ip: '123.123.123',
      statusCode: 400,
      url: 'http://myhost/mypath1',
      endpoint: 'myEndpoint',
      userAgent: 'myUserAgent',
      origin: 'myOrigin',
      xForwardedFor: 'myXForwardedFor',
      body: 'myBody',
      responseTime: 600,
      data: { a: 1, b: 2 }
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_REQUEST_TABLE}`);
    expect(data.length).toBe(2);
    expect(data[0].method).toBe('GET');
    expect(data[0].host).toBe('myhost');
    expect(data[0].ip).toBe('123.123.123');
    expect(data[1].statusCode).toBe(400);
    expect(data[1].url).toBe('http://myhost/mypath1');
    expect(data[1].endpoint).toBe('myEndpoint');
    expect(data[1].origin).toBe('myOrigin');
    expect(data[1].body).toBe('myBody');
    expect(data[1].responseTime).toBe(600);
    expect(data[0].responseTime).toBe(500);
    expect(data[1].data).toEqual({ a: 1, b: 2 });
  });
});
describe('DB Logger clear log tests', () => {
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
    await DbLogger.end();
    await MySqlConnManager.getInstance().end();
  });
  afterEach(async () => {
    const inst = await MySqlUtil.init();
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_TABLE}`);
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_REQUEST_TABLE}`);
    await inst.getConnectionPool().query(`DELETE FROM ${env.DB_LOGGER_WORKER_TABLE}`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  it('Clear Log', async () => {
    DbLogger.info('TestMethod', 'Logger.test.ts', 'Info level log');
    DbLogger.trace('TestMethod', 'Logger.test.ts', 'Trace level log');
    DbLogger.test('TestMethod', 'Logger.test.ts', 'Test level log');
    DbLogger.debug('TestMethod', 'Logger.test.ts', 'Debug level log');

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    expect(data.length).toBe(4);
    env.DB_LOGGER_RETENTION = 0;
    await DbLogger.clearStandardLogs();
    const data2 = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_TABLE}`);
    expect(data2.length).toBe(0);
  });
  it('Clear worker Log ', async () => {
    DbLogger.logWorker(WorkerLogStatus.START, 'Test worker', 'Start processing job document...');
    DbLogger.logWorker(WorkerLogStatus.INFO, 'Test worker', 'Now we are here...', { a: 1, b: 2 });
    DbLogger.logWorker(WorkerLogStatus.ERROR, 'Test worker', 'Now we have error', { a: 1, b: 2 }, new Error('Test error'));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_WORKER_TABLE}`);
    expect(data.length).toBe(3);
    env.DB_LOGGER_WORKER_RETENTION = 0;
    await DbLogger.clearWorkerLogs();
    const data2 = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_WORKER_TABLE}`);
    expect(data2.length).toBe(0);
  });

  it('Clear request Log ', async () => {
    DbLogger.logRequest({
      method: 'GET',
      host: 'myhost',
      ip: '123.123.123',
      statusCode: 200,
      url: 'http://myhost/mypath',
      endpoint: 'myEndpoint',
      userAgent: 'myUserAgent',
      origin: 'myOrigin',
      xForwardedFor: 'myXForwardedFor',
      body: 'myBody',
      responseTime: 500
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    DbLogger.logRequest({
      method: 'GET',
      host: 'myhost',
      ip: '123.123.123',
      statusCode: 400,
      url: 'http://myhost/mypath1',
      endpoint: 'myEndpoint',
      userAgent: 'myUserAgent',
      origin: 'myOrigin',
      xForwardedFor: 'myXForwardedFor',
      body: 'myBody',
      responseTime: 600,
      data: { a: 1, b: 2 }
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
    const inst = await MySqlUtil.init();
    const data = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_REQUEST_TABLE}`);
    expect(data.length).toBe(2);
    env.DB_LOGGER_REQUEST_RETENTION = 0;
    await DbLogger.clearRequestLogs();
    const data2 = await inst.paramExecuteDirect(`SELECT * FROM ${env.DB_LOGGER_REQUEST_TABLE}`);
    expect(data2.length).toBe(0);
  });
});
