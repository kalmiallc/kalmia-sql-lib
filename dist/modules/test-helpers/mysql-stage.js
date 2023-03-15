"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDatabase = exports.dropDatabase = exports.setupDatabase = exports.MySqlStage = void 0;
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
async function setupDatabase() {
    const conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
    const mysqlLoc = new mysql_util_1.MySqlUtil(conn);
    await mysqlLoc.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      \`json_field\` JSON NULL,
      \`set_field\` TEXT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `, {});
}
exports.setupDatabase = setupDatabase;
async function dropDatabase() {
    const conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
    const mysqlLoc = new mysql_util_1.MySqlUtil(conn);
    await mysqlLoc.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `, {});
}
exports.dropDatabase = dropDatabase;
async function cleanDatabase() {
    await dropDatabase();
    await setupDatabase();
}
exports.cleanDatabase = cleanDatabase;
//# sourceMappingURL=mysql-stage.js.map