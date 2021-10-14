import { PopulateFor, SerializeFor, WorkerDbTables } from '../../../config/types';
import { stringParser, integerParser } from '@rawmodel/parsers';
import { BaseModel } from '../../common/base.model';
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
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public workerId: number;

  /**
   * Worker name.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public workerName: number;

  /**
   * Worker type.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public workerType: string;

  /**
   * Worker log level.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public level: number;

  /**
   * Worker log message.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public message: string;

  /**
   * Worker log source function.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public sourceFunction: string;

  /**
   * Worker log additional data in JSON format.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFor.DB],
    serializable: [SerializeFor.INSERT_DB]
  })
  public data: string;
}
