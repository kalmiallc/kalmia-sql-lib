"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-use-before-define */
const core_1 = require("@rawmodel/core");
const parsers_1 = require("@rawmodel/parsers");
const types_1 = require("../../../config/types");
const mysql_conn_manager_1 = require("../../db-connection/mysql-conn-manager");
const mysql_stage_1 = require("../../test-helpers/mysql-stage");
const base_model_1 = require("../base.model");
const mysql_util_1 = require("./../../db-connection/mysql-util");
const testTableName = 'sql_lib_user';
describe('Base model', () => {
    let mySqlStage;
    beforeAll(async () => {
        mySqlStage = await mysql_stage_1.MySqlStage.getInstance();
        await setupDatabase();
    });
    afterAll(async () => {
        await dropDatabase();
        await mySqlStage.connManager.end();
    });
    it('Prop population - constructor', () => {
        const obj = {
            id: 1234,
            email: 'cotton-eyed joe',
            _createTime: new Date(),
            notAProp: 'ladaee'
        };
        const newUser = new TestUser(obj);
        expect(newUser.email).toBe(obj.email);
        expect(newUser.id).toBe(obj.id);
        expect(newUser._createTime).toBe(obj._createTime);
        expect(newUser.notAProp).toBe(undefined);
    });
    it('Prop population - none', () => {
        const obj = {
            id: 1234,
            email: 'cotton-eyed joe',
            _createTime: new Date(),
            notAProp: 'ladaee'
        };
        const newUser = new TestUser().populate(obj);
        expect(newUser.email).toBe(obj.email);
        expect(newUser.id).toBe(obj.id);
        expect(newUser._createTime).toBe(obj._createTime);
        expect(newUser.notAProp).toBe(undefined);
    });
    it('Prop population - profile', () => {
        const obj = {
            id: 1234,
            email: 'cotton-eyed joe',
            _createTime: new Date(),
            notAProp: 'ladaee'
        };
        const newUser = new TestUser().populate(obj, types_1.PopulateFor.PROFILE);
        expect(newUser.email).toBe(obj.email);
        expect(newUser.id).toBe(null);
        expect(newUser._createTime).toBe(null);
        expect(newUser.notAProp).toBe(undefined);
    });
    it('Prop serialization - none', () => {
        const obj = {
            id: 1234,
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser().populate(obj);
        const serialized = newUser.serialize();
        expect(serialized.email).toBe(obj.email);
        expect(serialized.id).toBe(obj.id);
        expect(serialized._createTime).toBe(obj._createTime);
    });
    it('Prop serialization - profile', () => {
        const obj = {
            id: 1234,
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser().populate(obj, types_1.SerializeFor.PROFILE);
        const serialized = newUser.serialize();
        expect(serialized.email).toBe(obj.email);
        expect(serialized.id).toBe(null);
        expect(serialized._createTime).toBe(null);
    });
    it('Create - OK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        expect(newUser.id).toBeTruthy();
    });
    it('Create - NOK', async () => {
        const obj = {
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await expect(newUser.create()).rejects.toThrowError();
    });
    it('Read - OK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        const getUser = await new TestUser().populateById(newUser.id);
        expect(getUser.id).toBeTruthy();
        expect(getUser.id).toBe(newUser.id);
        expect(getUser._createTime).toBeTruthy();
        expect(getUser._updateTime).toBeTruthy();
    });
    it('Read - NOK', async () => {
        const getUser = await new TestUser().populateById(1234);
        expect(getUser.id).toBe(null);
    });
    it('Persistence - OK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        expect(newUser.exists()).toBe(true);
    });
    it('Persistence - NOK 1', async () => {
        const getUser = await new TestUser().populateById(1234);
        expect(getUser.exists()).toBe(false);
    });
    it('Persistence - NOK 2', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        await newUser.delete();
        expect(newUser.exists()).toBe(false);
    });
    it('Update - OK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        newUser.email = 'change';
        await newUser.update();
        const getUser = await new TestUser().populateById(newUser.id);
        expect(getUser.email).not.toBe(obj.email);
        expect(getUser.email).toBe('change');
    });
    it('Update - NOK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        newUser.email = null;
        await expect(newUser.update()).rejects.toThrowError();
    });
    it('Delete - OK', async () => {
        const obj = {
            email: 'cotton-eyed joe',
            _createTime: new Date()
        };
        const newUser = new TestUser(obj);
        await newUser.create();
        await newUser.delete();
        expect(newUser.exists()).toBe(false);
        expect(newUser._updateTime).toBeTruthy();
        expect(newUser.status).toBe(types_1.DbModelStatus.DELETED);
        const getUser = await new TestUser().populateById(newUser.id);
        expect(getUser.exists()).toBe(false);
        expect(getUser._updateTime).toBeTruthy();
        expect(getUser.status).toBe(types_1.DbModelStatus.DELETED);
    });
    it('Delete - OK?', async () => {
        const newUser = await new TestUser().populateById(1234);
        await newUser.delete();
        expect(newUser.exists()).toBe(false);
        expect(newUser._updateTime).toBeTruthy();
        expect(newUser.status).toBe(types_1.DbModelStatus.DELETED);
    });
});
async function setupDatabase() {
    const conn = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection();
    const mysql = new mysql_util_1.MySqlUtil(conn);
    await mysql.paramExecute(`
    CREATE TABLE IF NOT EXISTS \`${testTableName}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL,
      \`status\` INT NOT NULL DEFAULT 1,
      \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`_createUser\` INT NULL,
      \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`_updateUser\` INT NULL,
      PRIMARY KEY (\`id\`));
  `, {});
}
class TestUser extends base_model_1.BaseModel {
    constructor() {
        super(...arguments);
        this.tableName = testTableName;
    }
}
__decorate([
    (0, core_1.prop)({
        parser: { resolver: (0, parsers_1.stringParser)() },
        populatable: [types_1.PopulateFor.DB, types_1.SerializeFor.PROFILE],
        serializable: [types_1.SerializeFor.PROFILE, types_1.SerializeFor.INSERT_DB, types_1.SerializeFor.UPDATE_DB]
    }),
    __metadata("design:type", String)
], TestUser.prototype, "email", void 0);
async function dropDatabase() {
    const conn = await mysql_conn_manager_1.MySqlConnManager.getInstance().getConnection();
    const mysql = new mysql_util_1.MySqlUtil(conn);
    await mysql.paramExecute(`
    DROP TABLE IF EXISTS \`${testTableName}\`;
  `, {});
}
async function cleanDatabase() {
    await dropDatabase();
    await setupDatabase();
}
//# sourceMappingURL=base.model.test.js.map