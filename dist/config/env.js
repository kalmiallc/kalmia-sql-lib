"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
/* eslint-disable radix */
const dotenv = require("dotenv");
const kalmia_common_lib_1 = require("kalmia-common-lib");
/**
 * Load variables from .env.
 */
dotenv.config();
exports.env = Object.assign(Object.assign({}, kalmia_common_lib_1.env), { 
    /**
     * Mysql URL.
     */
    MYSQL_HOST: process.env['MYSQL_HOST'], MYSQL_PORT: parseInt(process.env['MYSQL_PORT']) || 3306, 
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
     * MySql timezone -- https://github.com/mysqljs/mysql#connection-options
     */
    MYSQL_TIMEZONE: process.env['MYSQL_TIMEZONE'] || 'Z', 
    /**
     * Enable mysql debug
     */
    MYSQL_DEBUG: Boolean(process.env['MYSQL_DEBUG']) || false, 
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
    MYSQL_POOL_SIZE_TEST: parseInt(process.env['MYSQL_POOL_SIZE_TEST']) == 0 ? 0 : 5, 
    /**
     * Mysql SSL file paths
     */
    MYSQL_SSL_CA_FILE: process.env['MYSQL_SSL_CA_FILE'], MYSQL_SSL_KEY_FILE: process.env['MYSQL_SSL_KEY_FILE'], MYSQL_SSL_CERT_FILE: process.env['MYSQL_SSL_CERT_FILE'] });
//# sourceMappingURL=env.js.map