import { WorkerDbTables } from '../../../config/types';
import { BaseModel } from '../../common/base.model';
/**
 * Worker log model.
 */
export declare class WorkerLog extends BaseModel {
    /**
     * Worker logs table.
     */
    tableName: WorkerDbTables;
    /**
     * Worker ID.
     */
    workerId: number;
    /**
     * Worker name.
     */
    workerName: number;
    /**
     * Worker type.
     */
    workerType: string;
    /**
     * Worker log level.
     */
    level: number;
    /**
     * Worker log message.
     */
    message: string;
    /**
     * Worker log source function.
     */
    sourceFunction: string;
    /**
     * Worker log additional data in JSON format.
     */
    data: string;
}
//# sourceMappingURL=worker-log.model.d.ts.map