import { WorkerDbTables } from 'src/config/types';
import { BaseModel } from 'src/modules/common/base.model';
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
    workerId: string;
    /**
     * Worker log level.
     */
    level: number;
    /**
     * Worker log message.
     */
    message: string;
    /**
     * Worker log invocation method.
     */
    method: string;
    /**
     * Worker log additional data in JSON format.
     */
    data: string;
}
//# sourceMappingURL=worker-log.model.d.ts.map