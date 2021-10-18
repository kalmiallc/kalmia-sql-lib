/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { DbModelStatus, PopulateFor, SerializeFor } from '../../../config/types';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { MySqlStage } from '../../test-helpers/mysql-stage';
import { BaseModel } from '../base.model';
import { MySqlUtil } from './../../db-connection/mysql-util';

const testTableName = 'sql_lib_user';

describe('Base model', () => {
  let mySqlStage: MySqlStage;

  beforeAll(async () => {
    mySqlStage = await MySqlStage.getInstance();
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
    expect((newUser as any).notAProp).toBe(undefined);
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
    expect((newUser as any).notAProp).toBe(undefined);
  });

  it('Prop population - ALL', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createTime: new Date(),
      notAProp: 'ladaee'
    };
    const newUser = new TestUser().populate(obj, PopulateFor.ALL);
    expect(newUser.email).toBe(obj.email);
    expect(newUser.id).toBe(null);
    expect(newUser._createTime).toBe(null);
    expect((newUser as any).notAProp).toBe(undefined);
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

  it('Prop serialization - ALL', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createTime: new Date()
    };
    const newUser = new TestUser().populate(obj, PopulateFor.ALL);
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
    expect(newUser.status).toBe(DbModelStatus.DELETED);
    const getUser = await new TestUser().populateById(newUser.id);
    expect(getUser.exists()).toBe(false);
    expect(getUser._updateTime).toBeTruthy();
    expect(getUser.status).toBe(DbModelStatus.DELETED);
  });

  it('Delete - OK?', async () => {
    const newUser = await new TestUser().populateById(1234);
    await newUser.delete();
    expect(newUser.exists()).toBe(false);
    expect(newUser._updateTime).toBeTruthy();
    expect(newUser.status).toBe(DbModelStatus.DELETED);
  });
});

async function setupDatabase() {
  const conn = await MySqlConnManager.getInstance().getConnection();
  const mysql = new MySqlUtil(conn);
  await mysql.paramExecute(
    `
    CREATE TABLE IF NOT EXISTS \`${testTableName}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`email\` VARCHAR(255) NOT NULL,
      \`status\` INT NOT NULL DEFAULT 1,
      \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`_createUser\` INT NULL,
      \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`_updateUser\` INT NULL,
      PRIMARY KEY (\`id\`));
  `,
    {}
  );
}

class TestUser extends BaseModel {
  tableName = testTableName;

  /**
   * email
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB, PopulateFor.ALL],
    serializable: [SerializeFor.ALL, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public email: string;
}

async function dropDatabase() {
  const conn = await MySqlConnManager.getInstance().getConnection();
  const mysql = new MySqlUtil(conn);
  await mysql.paramExecute(
    `
    DROP TABLE IF EXISTS \`${testTableName}\`;
  `,
    {}
  );
}

async function cleanDatabase() {
  await dropDatabase();
  await setupDatabase();
}
