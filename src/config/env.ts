/* eslint-disable radix */
import * as dotenv from 'dotenv';
import { env as commonEnv, ICommonEnv } from 'kalmia-common-lib';

/**
 * Environment object interface.
 */
export interface IMySqlEnv {
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_DB: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_POOL_SIZE: number;
  MYSQL_CONNECTION_TIMEOUT: number;
  MYSQL_WAIT_TIMEOUT: number;

  MYSQL_HOST_TEST: string;
  MYSQL_PORT_TEST: number;
  MYSQL_DB_TEST: string;
  MYSQL_USER_TEST: string;
  MYSQL_PASSWORD_TEST: string;
  MYSQL_POOL_SIZE_TEST: number;
}

/**
 * Load variables from .env.
 */
dotenv.config();

export const env: IMySqlEnv & ICommonEnv = {
  ...commonEnv,
  /**
   * Mysql URL.
   */
  MYSQL_HOST: process.env['MYSQL_HOST'],
  MYSQL_PORT: parseInt(process.env['MYSQL_PORT']) || 3306,

  /**
   * Mysql database name.
   */
  MYSQL_DB: process.env['MYSQL_DB'],

  /**
   * Mysql user.
   */
  MYSQL_USER: process.env['MYSQL_USER'],

  /**
   * Mysql Password.
   */
  MYSQL_PASSWORD: process.env['MYSQL_PASSWORD'],

  /**
   * Mysql connection pool size. If pool size = 0 -- don't use pool
   */
  MYSQL_POOL_SIZE: parseInt(process.env['MYSQL_POOL_SIZE']) == 0 ? 0 : 10,

  /**
   * Time to wait for getting the connection.
   * This value is in milliseconds.
   */

  MYSQL_CONNECTION_TIMEOUT: parseInt(process.env['MYSQL_CONNECTION_TIMEOUT']) || 300,

  /**
   * Mysql wait timeout https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_wait_timeout
   * This value is in seconds
   */

  MYSQL_WAIT_TIMEOUT: parseInt(process.env['MYSQL_WAIT_TIMEOUT']) || 320,

  /**
   * Mysql test host.
   */
  MYSQL_HOST_TEST: process.env['MYSQL_HOST_TEST'] || 'localhost',

  /**
   * Mysql test port.
   */
  MYSQL_PORT_TEST: parseInt(process.env['MYSQL_PORT_TEST']) || 3306,

  /**
   * Mysql test database name.
   */
  MYSQL_DB_TEST: process.env['MYSQL_DB_TEST'],

  /**
   * Mysql test user.
   */
  MYSQL_USER_TEST: process.env['MYSQL_USER_TEST'],

  /**
   * Mysql test Password.
   */
  MYSQL_PASSWORD_TEST: process.env['MYSQL_PASSWORD_TEST'],

  /**
   * Mysql test connection pool size.
   */
  MYSQL_POOL_SIZE_TEST: parseInt(process.env['MYSQL_POOL_SIZE_TEST']) == 0 ? 0 : 5
};
