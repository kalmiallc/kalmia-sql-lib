import { BaseModel } from 'src/modules/common/base.model';
import { WorkerDbTables } from 'src/config/types';
/**
 * Worker job model.
 */
export declare class WorkerJob extends BaseModel {
    /**
     * Worker jobs table.
     */
    tableName: WorkerDbTables;
    /**
     * Unique name of the worker.
     */
    name: string;
    /**
     * Channel.
     */
    channel: number;
    /**
     * Interval at which the worker is scheduled - CRON syntax.
     */
    interval: string;
    /**
     * Worker job last run date - set at the beginning of execution.
     */
    lastRun: Date;
    /**
     * Date at which the worker will be run - set at creation or at next interval.
     */
    nextRun: Date;
    /**
     * Value for worker job timeout.
     */
    timeout: number;
    /**
     * Input for the worker.
     */
    input: string;
    /**
     * Number of retries worker has made.
     */
    retries: number;
    /**
     * Any additional parameters which can be parsed in worker class constructor.
     */
    parameters: any;
    /**
     * Property which defines if job should be removed after successful run.
     */
    autoRemove: boolean;
    /**
     * Amount of time worker took for completing planned portion of job.
     */
    lastDuration: number;
    /**
     * Last logged error.
     */
    lastError: string;
    /**
     * Date of last successful run - set at the end of execution.
     */
    lastCompleted: Date;
    /**
     * Date of the last recorded error.
     */
    lastFailed: Date;
    /**
     * Gets pending jobs.
     * @returns Array of pending jobs.
     */
    getPendingJobs(): Promise<Array<WorkerJob>>;
    /**
     * Gets worker definition.
     * @returns Worker definition object.
     */
    getWorkerDefinition(): any;
    /**
     * Updates the worker's definition.
     * @param data Worker definition data.
     */
    updateWorkerDefinition(data: any): Promise<void>;
}
//# sourceMappingURL=worker-job.model.d.ts.map