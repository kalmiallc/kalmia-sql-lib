"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable-next-line @typescript-eslint/quotes */
const kalmia_common_lib_1 = require("kalmia-common-lib");
const mysql_stage_1 = require("../../test-helpers/mysql-stage");
const mysql_conn_manager_1 = require("../mysql-conn-manager");
const mysql_util_1 = require("../mysql-util");
describe('MySQL coon pool automatic', () => {
    let conn;
    let sqlUtil;
    beforeAll(async () => {
        conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
        sqlUtil = new mysql_util_1.MySqlUtil(conn);
        await (0, mysql_stage_1.setupDatabase)();
    });
    afterAll(async () => {
        await (0, mysql_stage_1.dropDatabase)();
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end();
    });
    it('Query should find one', async () => {
        await sqlUtil.paramExecuteDirect(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`, {
            email: `${Math.floor(Math.random() * 10000)}@example.com`,
            id: Math.floor(Math.random() * 1000000)
        });
        const count = await sqlUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count.length).toBe(1);
        expect(count).toEqual(expect.arrayContaining([
            expect.objectContaining({
                COUNT: 1
            })
        ]));
    });
    it('Query should fail', async () => {
        await insertObject();
        await (0, mysql_stage_1.cleanDatabase)();
        try {
            await sqlUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
            expect(true).toBe(false);
        }
        catch (error) {
            expect(error).toBeDefined();
        }
    });
    it('Reinitialize connection', async () => {
        let connLoc = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection();
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end();
        connLoc = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection();
        const sU = new mysql_util_1.MySqlUtil(connLoc);
        const dat = await sU.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(dat.length).toBeGreaterThan(0);
    });
    it('Query should use two connections', async () => {
        const secondConn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection('secondary'));
        const secondUtil = new mysql_util_1.MySqlUtil(secondConn);
        await sqlUtil.paramExecuteDirect(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (
        @email,
        @id
      )`, {
            email: `${Math.floor(Math.random() * 10000)}@example.com`,
            id: Math.floor(Math.random() * 1000000)
        });
        const count = await secondUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        await mysql_conn_manager_1.MySqlConnManager.getInstance().end('secondary');
        expect(count.length).toBe(1);
        expect(count).toEqual(expect.arrayContaining([
            expect.objectContaining({
                COUNT: 1
            })
        ]));
    });
    async function insertObject() {
        await sqlUtil.paramExecuteDirect(`INSERT INTO \`sql_lib_user\` (
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
    let connId = 0;
    beforeAll(async () => {
        conn = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnectionNoPool();
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(1);
        connId = mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections()[0].connectionId;
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
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
    });
    it('Query should find one', async () => {
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).not.toBeNull();
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).toBe(connId);
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
describe('MySql use init function', () => {
    let util;
    beforeAll(async () => {
        util = await mysql_util_1.MySqlUtil.init();
        await util.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `);
    });
    afterAll(async () => {
        await util.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `);
        await mysql_util_1.MySqlUtil.end();
    });
    it('Query should find one', async () => {
        await util.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) });
        const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count.length).toBe(1);
    });
});
describe('MySql use initAndStartTrans', () => {
    let utilInt;
    beforeAll(async () => {
        utilInt = await mysql_util_1.MySqlUtil.initAndStartTrans();
        await utilInt.sql.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `, {}, utilInt.conn);
        await utilInt.conn.commit();
    });
    afterAll(async () => {
        await utilInt.sql.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `);
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(1);
        utilInt.conn.release();
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
        await mysql_util_1.MySqlUtil.end();
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
    });
    it('Query should find one', async () => {
        await utilInt.sql.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) });
        const count = await utilInt.sql.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count.length).toBe(1);
    });
});
describe('MySql use init connection from pool with the transaction, and use pass the active connection', () => {
    let util;
    beforeAll(async () => {
        util = await mysql_util_1.MySqlUtil.init(true);
        await util.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `);
    });
    afterAll(async () => {
        await util.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `);
        expect(util.getConnectionPool().pool._freeConnections.length).toBe(0);
        expect(util.getConnectionPool().pool._closed).toBe(false);
        const conn = util.getActiveConnection();
        await conn.release();
        expect(util.getConnectionPool().pool._freeConnections.length).toBe(1);
        await util.end();
        expect(util.getConnectionPool().pool._closed).toBe(true);
    });
    it('Query should be rolled back', async () => {
        const conn = await util.start();
        const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(countStart[0].COUNT).toBe(0);
        await util.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) }, conn);
        await conn.rollback();
        const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count[0].COUNT).toBe(0);
    });
    it('Query should fine one in transaction', async () => {
        const conn = await util.start();
        const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(countStart[0].COUNT).toBe(0);
        await util.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) }, conn);
        await conn.commit();
        const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count[0].COUNT).toBe(1);
    });
});
describe('MySql use init connection from pool with the transaction, and use direct pass', () => {
    let util;
    beforeAll(async () => {
        let connId;
        mysql_conn_manager_1.MySqlConnManager.addConnOpenListener((conn) => {
            kalmia_common_lib_1.AppLogger.test('mysql.connection.test', 'MySqlConnManager.addConnOpenListener - connection open', conn.threadId);
            connId = conn.threadId;
        });
        mysql_conn_manager_1.MySqlConnManager.addConnCloseListener((conn) => {
            kalmia_common_lib_1.AppLogger.test('mysql.connection.test', 'MySqlConnManager.addConnCloseListener - connection close', conn.threadId);
            expect(conn.threadId).toBe(connId);
        });
        util = await mysql_util_1.MySqlUtil.init(true);
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(1);
        await util.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`sql_lib_user\` (
      \`id\` INT NOT NULL,
      \`email\` VARCHAR(255) NULL,
      \`_username\` VARCHAR(255) NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`email_UNIQUE\` (\`email\` ASC) VISIBLE);
  `);
    });
    afterAll(async () => {
        var _a;
        await util.paramExecute(`
    DROP TABLE IF EXISTS \`sql_lib_user\`;
  `);
        expect(util.getConnectionPool().pool._freeConnections.length).toBe(0);
        expect(util.getConnectionPool().pool._closed).toBe(false);
        const conn = util.getActiveConnection();
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections()[0].connectionId).toBe((_a = conn === null || conn === void 0 ? void 0 : conn.connection) === null || _a === void 0 ? void 0 : _a.connectionId);
        await conn.release();
        expect(util.getConnectionPool().pool._freeConnections.length).toBe(1);
        expect(mysql_conn_manager_1.MySqlConnManager.getInstance().getActiveConnections().length).toBe(0);
        await util.end();
        expect(util.getConnectionPool().pool._closed).toBe(true);
    });
    it('Query should be rolled back', async () => {
        const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        await util.getActiveConnection().beginTransaction();
        expect(countStart[0].COUNT).toBe(0);
        await util.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) });
        await util.getActiveConnection().rollback();
        const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count[0].COUNT).toBe(0);
    });
    it('Query should fine one in transaction', async () => {
        const countStart = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        await util.getActiveConnection().beginTransaction();
        expect(countStart[0].COUNT).toBe(0);
        await util.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id
      ) VALUES (@email, @id)`, { email: Math.floor(Math.random() * 10000) + '@example.com', id: Math.floor(Math.random() * 1000000) });
        await util.getActiveConnection().commit();
        const count = await util.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
        expect(count[0].COUNT).toBe(1);
    });
});
//# sourceMappingURL=mysql.connection.test.js.map