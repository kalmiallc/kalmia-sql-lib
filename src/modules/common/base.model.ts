import { Model, ModelConfig, prop } from '@rawmodel/core';
import { dateParser, integerParser } from '@rawmodel/parsers';
import { Connection, Pool, PoolConnection } from 'mysql2/promise';
import { DbModelStatus, PopulateFor, SerializeFor } from '../../config/types';
import { MySqlConnManager } from '../db-connection/mysql-conn-manager';
import { MySqlUtil } from '../db-connection/mysql-util';
import { Context } from './context';

/**
 * Common model related objects.
 */
export { prop };

/**
 * Base model.
 */
export abstract class BaseModel extends Model<Context> {

  /**
   * Time of creation
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _createdAt: Date;

  /**
   * Time of last update
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _updatedAt: Date;

  /**
   * Time of marking as deleted
   */
  @prop({
    parser: { resolver: dateParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public _deletedAt: Date;

  /**
   * Base model's id property definition
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE]
  })
  public id: number;

  /**
   * Base model's status property definition
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.PROFILE, SerializeFor.UPDATE_DB],
    defaultValue: () => DbModelStatus.INACTIVE
  })
  public status: number;

  /**
   * Model's table name.
   */
  public abstract tableName: string;

  /**
   * Class constructor.
   *
   * @param data Input data.
   * @param config Model configuration.
   */
  public constructor(data?: unknown, config?: ModelConfig<Context>) {
    super(data, config);
  }

  /**
   * Tells if the model represents a document stored in the database.
   */
  public isPersistent(): boolean {
    return !!this.id && !this._deletedAt;
  }

  /**
   * Returns an instance of a database connection.
   */
  public async db(): Promise<Pool | Connection> {
    return await MySqlConnManager.getInstance().getConnection();
  }

  /**
   * Saves model data in the database as a new document.
   */
  public async create(options: { conn?: PoolConnection } = {}): Promise<this> {
    const serializedModel = this.serialize(SerializeFor.INSERT_DB);
    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }
    try {
      const createQuery = `
      INSERT INTO \`${this.tableName}\`
      ( ${Object.keys(serializedModel)
    .map((x) => `\`${x}\``)
    .join(', ')} )
      VALUES (
        ${Object.keys(serializedModel)
    .map((key) => `@${key}`)
    .join(', ')}
      )`;

      await mySqlHelper.paramExecute(createQuery, serializedModel, options.conn);
      if (!this.id) {
        const req = await mySqlHelper.paramExecute('SELECT last_insert_id() AS id;', null, options.conn);
        this.id = req[0].id;
      }

      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }

  /**
   * Updates model data in the database.
   */
  public async update(options: { conn?: PoolConnection } = {}): Promise<this> {
    const serializedModel = this.serialize(SerializeFor.UPDATE_DB);

    // remove non-updatable parameters
    delete serializedModel.id;
    delete serializedModel.createTime;
    // delete serializedModel.deletionTime;
    // delete serializedModel.updateTime;

    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }

    try {
      const createQuery = `
      UPDATE \`${this.tableName}\`
      SET
        ${Object.keys(serializedModel)
    .map((x) => `\`${x}\` = @${x}`)
    .join(',\n')}
      WHERE id = @id
      `;

      // re-set id parameter for where clause.
      serializedModel.id = this.id;

      await mySqlHelper.paramExecute(createQuery, serializedModel, options.conn);

      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }

  /**
   * Populates model fields by id.
   *
   * @param id User's id.
   */
  public async populateById(id: any): Promise<this> {
    const data = await new MySqlUtil((await MySqlConnManager.getInstance().getConnection()) as Pool).paramQuery(
      `
      SELECT * FROM ${this.tableName}
      WHERE id = @id
    `,
      { id }
    );

    if (data && data.length) {
      return this.populate(data[0], PopulateFor.DB);
    } else {
      return this.reset();
    }
  }

  /**
   * Mark model as deleted in the database.
   */
  public async delete(options: { conn?: PoolConnection } = {}): Promise<this> {
    let isSingleTrans = false;
    let mySqlHelper: MySqlUtil;
    if (!options.conn) {
      isSingleTrans = true;
      const pool = (await MySqlConnManager.getInstance().getConnection()) as PoolConnection;
      mySqlHelper = new MySqlUtil(pool);
    }
    if (isSingleTrans) {
      options.conn = await mySqlHelper.start();
    }

    try {
      const createQuery = `
      UPDATE \`${this.tableName}\`
      SET status = @status,
        _deletedAt = @_deletedAt
      WHERE id = @id
      `;


      await mySqlHelper.paramExecute(createQuery, {
        id: this.id,
        status: (this.status = DbModelStatus.DELETED),
        _deletedAt: (this._deletedAt = new Date()),
      }, options.conn);

      if (isSingleTrans) {
        await mySqlHelper.commit(options.conn);
      }
    } catch (err) {
      if (isSingleTrans) {
        await mySqlHelper.rollback(options.conn);
      }
      throw new Error(err);
    }

    return this;
  }
}
