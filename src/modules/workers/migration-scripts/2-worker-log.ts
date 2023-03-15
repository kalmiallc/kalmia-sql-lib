import { DbModelStatus, WorkerDbTables } from '../../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${WorkerDbTables.WORKER_LOG}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`status\` INT NOT NULL DEFAULT '${DbModelStatus.ACTIVE}',
    \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`_createUser\` INT NULL,
    \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`_updateUser\` INT NULL,
    \`workerId\` INT NULL,
    \`workerName\` VARCHAR(45) NULL,
    \`workerType\` VARCHAR(45) NULL,
    \`level\` INT NULL,
    \`message\` VARCHAR(500) NULL,
    \`sourceFunction\` VARCHAR(200) NULL,
    \`data\` JSON NULL,
    PRIMARY KEY (\`id\`))
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${WorkerDbTables.WORKER_LOG}\`;
  `);
};
