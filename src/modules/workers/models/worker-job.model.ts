import { booleanParser, dateParser, integerParser, stringParser } from '@rawmodel/parsers';
import { prop } from '@rawmodel/core';
import { JSONParser } from 'kalmia-common-lib';
import { BaseModel } from '../../common/base.model';
import { DbModelStatus, PopulateFor, SerializeFor, WorkerDbTables } from '../../../config/types';
import { MySqlUtil } from '../../db-connection/mysql-util';

/**
 * Worker job model.
 */
export class WorkerJob extends BaseModel {
  /**
   * Worker jobs table.
   */
  tableName = WorkerDbTables.WORKER_JOB;

  /**
   * Unique name of the worker.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public name: string;

  /**
   * Channel.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER],
    defaultValue: 1,
    fakeValue: 1
  })
  public channel: number;

  /**
   * Interval at which the worker is scheduled - CRON syntax.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER],
    fakeValue: '* * * * * *'
  })
  public interval: string;

  /**
   * Worker job last run date - set at the beginning of execution.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public lastRun: Date;

  /**
   * Date at which the worker will be run - set at creation or at next interval.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public nextRun: Date;

  /**
   * Value for worker job timeout.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER],
    defaultValue: 15 * 60
  })
  public timeout: number;

  /**
   * Input for the worker.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public input: string;

  /**
   * Number of retries worker has made.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER],
    defaultValue: 0,
    fakeValue: 1
  })
  public retries: number;

  /**
   * Any additional parameters which can be parsed in worker class constructor.
   */
  @prop({
    parser: { resolver: JSONParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public parameters: any;

  /**
   * Property which defines if job should be removed after successful run.
   */
  @prop({
    parser: { resolver: booleanParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public autoRemove: boolean;

  /**
   * Amount of time worker took for completing planned portion of job.
   */
  @prop({
    parser: { resolver: integerParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public lastDuration: number;

  /**
   * Last logged error.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public lastError: string;

  /**
   * Date of last successful run - set at the end of execution.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public lastCompleted: Date;

  /**
   * Date of the last recorded error.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.PROFILE, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB, SerializeFor.WORKER],
    populatable: [PopulateFor.DB, PopulateFor.PROFILE, PopulateFor.WORKER]
  })
  public lastFailed: Date;

  /**
   * Gets pending jobs.
   * @returns Array of pending jobs.
   */
  public async getPendingJobs(): Promise<Array<WorkerJob>> {
    const pendingJobs = new MySqlUtil(await this.db())
      .paramExecute(
        `
      SELECT * FROM \`${this.tableName}\`
      WHERE status = ${DbModelStatus.ACTIVE}
      AND nextRun IS NOT NULL
      AND nextRun <= NOW()
      AND (
        lastRun IS NULL
        OR lastRun <= nextRun
        OR DATE_ADD(lastRun, INTERVAL timeout SECOND) < NOW()
      )
    `
      )
      .then((rows) => rows.map((x) => new WorkerJob(x, this.getContext())));

    return pendingJobs;
  }

  /**
   * Gets worker definition.
   * @returns Worker definition object.
   */
  public getWorkerDefinition(): any {
    if (!this.parameters) {
      this.parameters = {};
    }
    this.parameters.channel = this.channel;

    return {
      ...this.serialize(SerializeFor.WORKER)
    };
  }

  /**
   * Updates the worker's definition.
   * @param data Worker definition data.
   */
  public async updateWorkerDefinition(data: any): Promise<void> {
    await this.populateById(data.id);
    this.populate(data, PopulateFor.WORKER);
    await this.update();
  }
}
