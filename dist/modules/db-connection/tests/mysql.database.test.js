"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_conn_manager_1 = require("../../db-connection/mysql-conn-manager");
const env_1 = require("./../../../config/env");
const mysql_util_1 = require("./../../db-connection/mysql-util");
describe('MySQL coon pool', () => {
    let conn;
    let sqlUtil;
    env_1.env.MYSQL_POOL_SIZE_TEST = 5;
    beforeAll(async () => {
        conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
        sqlUtil = new mysql_util_1.MySqlUtil(conn);
        await setupDatabase();
    });
    afterAll(async () => {
        await dropDatabase();
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end();
    });
    it('Query should find one', async () => {
        await sqlUtil.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`, {
            email: `${Math.floor(Math.random() * 10000)}@example.com`,
            id: Math.floor(Math.random() * 1000000)
        });
        const count = await sqlUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count.length).toBe(1);
        expect(count).toEqual(expect.arrayContaining([
            expect.objectContaining({
                COUNT: 1
            })
        ]));
    });
    it('Query should fail', async () => {
        await insertObject();
        await cleanDatabase();
        try {
            await sqlUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
            expect(true).toBe(false);
        }
        catch (error) {
            expect(error).toBeDefined();
        }
    });
    it('Query should use two connections', async () => {
        const secondConn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection('secondary'));
        const secondUtil = new mysql_util_1.MySqlUtil(secondConn);
        await sqlUtil.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`, {
            email: `${Math.floor(Math.random() * 10000)}@example.com`,
            id: Math.floor(Math.random() * 1000000)
        });
        const count = await secondUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end('secondary');
        expect(count.length).toBe(1);
        expect(count).toEqual(expect.arrayContaining([
            expect.objectContaining({
                COUNT: 1
            })
        ]));
    });
    async function insertObject() {
        await sqlUtil.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`, {
            email: `${Math.floor(Math.random() * 10000)}@example.com`,
            id: Math.floor(Math.random() * 1000000)
        });
    }
});
describe('MySQL no pool', () => {
    let conn;
    beforeAll(async () => {
        conn = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnectionNoPool();
        await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `);
    });
    afterAll(async () => {
        await conn.execute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `);
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end();
    });
    it('Query should find one', async () => {
        await conn.execute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        "${Math.floor(Math.random() * 10000)}@example.com",
        "${Math.floor(Math.random() * 1000000)}"
      )`);
        const count = await conn.execute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count.length).toBe(2);
    });
});
async function setupDatabase() {
    const conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
    const mysqlLoc = new mysql_util_1.MySqlUtil(conn);
    await mysqlLoc.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `, {});
}
async function dropDatabase() {
    const conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
    const mysqlLoc = new mysql_util_1.MySqlUtil(conn);
    await mysqlLoc.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `, {});
}
async function cleanDatabase() {
    await dropDatabase();
    await setupDatabase();
}
//# sourceMappingURL=mysql.database.test.js.map