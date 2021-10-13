import { DbModelStatus, WorkerDbTables } from 'src';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${WorkerDbTables.WORKER_JOB}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`status\` INT NOT NULL DEFAULT '${DbModelStatus.ACTIVE}',
    \`_createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`_createUser\` INT NULL,
    \`_updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`_updateUser\` INT NULL,
    \`name\` VARCHAR(45) NOT NULL,
    \`channel\` INT NULL,
    \`interval\` VARCHAR(45) NULL,
    \`lastRun\` DATETIME NULL,
    \`nextRun\` DATETIME NULL,
    \`timeout\` INT NULL,
    \`input\` VARCHAR(300) NULL,
    \`retries\` INT NULL,
    \`parameters\` JSON NULL,
    \`autoRemove\` TINYINT NULL DEFAULT false,
    \`lastDuration\` INT NULL,
    \`lastError\` TEXT NULL,
    \`lastCompleted\` DATETIME NULL,
    \`lastFailed\` DATETIME NULL,
    PRIMARY KEY (\`id\`))
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${WorkerDbTables.WORKER_JOB}\`;
  `);
};
