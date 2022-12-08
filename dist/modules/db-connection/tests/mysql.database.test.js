"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_conn_manager_1 = require("../../db-connection/mysql-conn-manager");
const mysql_stage_1 = require("../../test-helpers/mysql-stage");
const env_1 = require("./../../../config/env");
const mysql_util_1 = require("./../../db-connection/mysql-util");
describe('MySQL coon pool', () => {
    let conn;
    let sqlUtil;
    env_1.env.MYSQL_POOL_SIZE_TEST = 5;
    beforeAll(async () => {
        conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
        sqlUtil = new mysql_util_1.MySqlUtil(conn);
        await mysql_stage_1.setupDatabase();
    });
    afterAll(async () => {
        await mysql_stage_1.dropDatabase();
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
    it('Should be able to insert array and query it', async () => {
        var _a, _b, _c, _d;
        await sqlUtil.paramExecute(`INSERT INTO \`sql_lib_user\` (
        email,
        id,
        json_field,
        set_field
      ) VALUES (
        @email,
        @id,
        @json_field,
        @set_field
      )`, {
            email: `kalmia_test@example.com`,
            id: Math.floor(Math.random() * 1000000),
            json_field: [{ value: 4 }, { value: 6 }, { value: 10 }],
            set_field: [4, 6, 10]
        });
        const response = await sqlUtil.paramExecute("SELECT * FROM `sql_lib_user` WHERE email = 'kalmia_test@example.com';");
        expect(response.length).toBe(1);
        expect((_a = response[0]) === null || _a === void 0 ? void 0 : _a.json_field.reduce((partialSum, object) => partialSum + object.value, 0)).toBe(20);
        expect((_b = response[0]) === null || _b === void 0 ? void 0 : _b.json_field).toEqual(expect.arrayContaining([
            expect.objectContaining({
                value: 4
            })
        ]));
        expect((_c = response[0]) === null || _c === void 0 ? void 0 : _c.set_field.split(',').reduce((partialSum, value) => partialSum + Number(value), 0)).toBe(20);
        expect((_d = response[0]) === null || _d === void 0 ? void 0 : _d.set_field.split(',')).toEqual(expect.arrayContaining(['4', '6', '10']));
    });
    it('Query should fail', async () => {
        await insertObject();
        await mysql_stage_1.cleanDatabase();
        try {
            await sqlUtil.paramExecute("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
            expect(true).toBe(false);
        }
        catch (error) {
            expect(error).toBeDefined();
        }
    });
    it('Should escape param', async () => {
        await insertObject();
        const attack = "' UNION all SELECT @@version, NULL, NULL--'";
        const SQL = `SELECT * FROM sql_lib_user Where email like @attack`;
        const data = await sqlUtil.paramExecute(SQL, { attack });
        expect(data.length).toBe(0);
        const data2 = await sqlUtil.paramExecuteDirect(SQL, { attack });
        expect(data2.length).toBe(0);
        await mysql_stage_1.cleanDatabase();
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
describe('MySQL coon pool automatic', () => {
    let conn;
    let sqlUtil;
    beforeAll(async () => {
        conn = (await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection());
        sqlUtil = new mysql_util_1.MySqlUtil(conn);
        await mysql_stage_1.setupDatabase();
    });
    afterAll(async () => {
        await mysql_stage_1.dropDatabase();
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
        await mysql_stage_1.cleanDatabase();
        try {
            await sqlUtil.paramExecuteDirect("SELECT COUNT(*) AS 'COUNT' FROM `sql_lib_user`;");
            expect(true).toBe(false);
        }
        catch (error) {
            expect(error).toBeDefined();
        }
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
//# sourceMappingURL=mysql.database.test.js.map