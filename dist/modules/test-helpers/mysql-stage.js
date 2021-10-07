"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySqlStage = void 0;
const kalmia_common_lib_1 = require("kalmia-common-lib");
const env_1 = require("../../config/env");
const mysql_conn_manager_1 = require("../db-connection/mysql-conn-manager");
const mysql_util_1 = require("../db-connection/mysql-util");
/**
 * Testing MySQL stage class.
 */
class MySqlStage {
    constructor() { }
    static async getInstance() {
        if (!MySqlStage.instance) {
            MySqlStage.instance = new MySqlStage();
            await MySqlStage.instance.init();
        }
        return MySqlStage.instance;
    }
    /**
     * MySQL testing environment init function.
     */
    async init() {
        env_1.env.APP_ENV = kalmia_common_lib_1.ApplicationEnv.TEST;
        this.connManager = mysql_conn_manager_1.MySqlConnManager.getInstance();
        this.dbConn = await this.connManager.getConnection();
        this.utils = new mysql_util_1.MySqlUtil(this.dbConn);
    }
    /**
     * Closes MySQL connection.
     */
    async close() {
        await this.connManager.end();
    }
}
exports.MySqlStage = MySqlStage;
//# sourceMappingURL=mysql-stage.js.map