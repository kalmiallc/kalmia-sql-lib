"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
/* eslint-disable radix */
const dotenv = require("dotenv");
const kalmia_common_lib_1 = require("kalmia-common-lib");
const types_1 = require("./types");
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
     * Defines the type of connection pooling used for the database
     */
    MYSQL_CONN_STRATEGY: process.env['MYSQL_CONN_STRATEGY'] || types_1.ConnectionStrategy.LOCAL_POOL, 
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
    MYSQL_POOL_SIZE_TEST: parseInt(process.env['MYSQL_POOL_TEST']) || 5 });
//# sourceMappingURL=env.js.map