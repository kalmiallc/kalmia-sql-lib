import { PopulateFor, WorkerDbTables } from 'src/config/types';
import { stringParser, integerParser } from '@rawmodel/parsers';
import { BaseModel } from 'src/modules/common/base.model';
import { prop } from '@rawmodel/core';

/**
 * Worker log model.
 */
export class WorkerLog extends BaseModel {
  /**
   * Worker logs table.
   */
  tableName = WorkerDbTables.WORKER_LOG;

  /**
   * Worker ID.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB]
  })
  public workerId: string;

  /**
   * Worker log level.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB]
  })
  public level: number;

  /**
   * Worker log message.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB]
  })
  public message: string;

  /**
   * Worker log invocation method.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB]
  })
  public method: string;

  /**
   * Worker log additional data in JSON format.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB]
  })
  public data: string;
}
