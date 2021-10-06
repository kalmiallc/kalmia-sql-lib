/* eslint-disable radix */
import * as dotenv from 'dotenv';
import { env as commonEnv, ICommonEnv } from 'kalmia-common-lib';
import { ConnectionStrategy } from './types';

/**
 * Environment object interface.
 */
export interface IMySqlEnv {
  MYSQL_CONN_STRATEGY: string;
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_DB: string;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_POOL_SIZE: number;

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
   * Defines the type of connection pooling used for the database
   */
  MYSQL_CONN_STRATEGY: process.env['MYSQL_CONN_STRATEGY'] || ConnectionStrategy.LOCAL_POOL,

  /**
   * Mysql user.
   */
  MYSQL_USER: process.env['MYSQL_USER'],

  /**
   * Mysql Password.
   */
  MYSQL_PASSWORD: process.env['MYSQL_PASSWORD'],

  /**
   * Mysql connection pool size.
   */
  MYSQL_POOL_SIZE: parseInt(process.env['MYSQL_POOL_SIZE']) || 10,

  /**
   * MongoDB test host.
   */
  MYSQL_HOST_TEST: process.env['MYSQL_HOST_TEST'] || 'localhost',

  /**
   * MongoDB test port.
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
  MYSQL_POOL_SIZE_TEST: parseInt(process.env['MYSQL_POOL_TEST']) || 5
};
