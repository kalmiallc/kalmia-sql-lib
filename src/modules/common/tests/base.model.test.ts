import type * as mysql from 'mysql2/promise';
import { MySqlConnManager } from '../../db-connection/mysql-conn-manager';
import { MySqlUtil } from './../../db-connection/mysql-util';
import { BaseModel } from '../base.model';
import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { DbModelStatus, PopulateFor, SerializeFor } from '../../../config/types';

const testTableName = 'sql_lib_user';

describe('Base model', () => {
  let conn: mysql.Pool | mysql.Connection
  let sqlUtil: MySqlUtil;

  beforeAll(async () => {
    conn = await MySqlConnManager.getInstance().getConnection();
    sqlUtil =  new MySqlUtil(conn);
    await setupDatabase();
  });

  afterAll(async () => {
    await dropDatabase();
    await MySqlConnManager.getInstance().end();
  });

  it('Prop population - constructor', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createdAt: new Date(),
      notAProp: 'ladaee'
    };
    const newUser = new TestUser(obj);
    expect(newUser.email).toBe(obj.email)
    expect(newUser.id).toBe(obj.id)
    expect(newUser._createdAt).toBe(obj._createdAt)
    expect((newUser as any).notAProp).toBe(undefined)
  });

  it('Prop population - none', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createdAt: new Date(),
      notAProp: 'ladaee'
    };
    const newUser = new TestUser().populate(obj);
    expect(newUser.email).toBe(obj.email)
    expect(newUser.id).toBe(obj.id)
    expect(newUser._createdAt).toBe(obj._createdAt)
    expect((newUser as any).notAProp).toBe(undefined)
  });

  it('Prop population - profile', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createdAt: new Date(),
      notAProp: 'ladaee'
    };
    const newUser = new TestUser().populate(obj, PopulateFor.PROFILE);
    expect(newUser.email).toBe(obj.email)
    expect(newUser.id).toBe(null)
    expect(newUser._createdAt).toBe(null)
    expect((newUser as any).notAProp).toBe(undefined)
  });

  it('Prop serialization - none', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser().populate(obj);
    const serialized = newUser.serialize();
    expect(serialized.email).toBe(obj.email)
    expect(serialized.id).toBe(obj.id)
    expect(serialized._createdAt).toBe(obj._createdAt)
  });

  it('Prop serialization - profile', () => {
    const obj = {
      id: 1234,
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser().populate(obj, SerializeFor.PROFILE);
    const serialized = newUser.serialize();
    expect(serialized.email).toBe(obj.email)
    expect(serialized.id).toBe(null)
    expect(serialized._createdAt).toBe(null)
  });

  it('Create - OK', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();
    expect(newUser.id).toBeTruthy();
  });

  it('Create - NOK', async () => {
    const obj = {
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await expect(newUser.create()).rejects.toThrowError();
  });

  it('Read - OK', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();

    const getUser = await new TestUser().populateById(newUser.id);
    expect(getUser.id).toBeTruthy();
    expect(getUser.id).toBe(newUser.id);
    expect(getUser._createdAt).toBeTruthy();
    expect(getUser._updatedAt).toBeTruthy();
  });

  it('Read - NOK', async () => {
    const getUser = await new TestUser().populateById(1234);
    expect(getUser.id).toBe(null);
  });

  it('Persistence - OK', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();
    expect(newUser.isPersistent()).toBe(true);
  });

  it('Persistence - NOK 1', async () => {
    const getUser = await new TestUser().populateById(1234);
    expect(getUser.isPersistent()).toBe(false);
  });

  it('Persistence - NOK 2', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();
    await newUser.delete();
    expect(newUser.isPersistent()).toBe(false);
  });

  it('Update - OK', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
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
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();
    newUser.email = null;
    await expect(newUser.update()).rejects.toThrowError();
  });

  it('Delete - OK', async () => {
    const obj = {
      email: 'cotton-eyed joe',
      _createdAt: new Date()
    };
    const newUser = new TestUser(obj);
    await newUser.create();
    await newUser.delete();
    expect(newUser.isPersistent()).toBe(false);
    expect(newUser._deletedAt).toBeTruthy();
    expect(newUser.status).toBe(DbModelStatus.DELETED);
    const getUser = await new TestUser().populateById(newUser.id);
    expect(getUser.isPersistent()).toBe(false);
    expect(getUser._deletedAt).toBeTruthy();
    expect(getUser.status).toBe(DbModelStatus.DELETED);
  });

  it('Delete - OK?', async () => {
    const newUser = await new TestUser().populateById(1234);
    await newUser.delete();
    expect(newUser.isPersistent()).toBe(false);
    expect(newUser._deletedAt).toBeTruthy();
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
      \`_createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`_updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`_deletedAt\` DATETIME NULL,
      PRIMARY KEY (\`id\`));
  `,
    { },
  );
}

class TestUser extends BaseModel {
  tableName = testTableName

  /**
   * email
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB, SerializeFor.PROFILE],
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
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
    { },
  );
}

async function cleanDatabase() {
  await dropDatabase();
  await setupDatabase();
}
