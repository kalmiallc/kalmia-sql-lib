import { env } from '../../config/env';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env.DB_LOGGER_WORKER_TABLE}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`ts\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`status\` VARCHAR(100) NULL,
      \`worker\` VARCHAR(100) NULL,
      \`message\` TEXT NULL,      
      \`data\` JSON NULL,
      \`error\` JSON NULL,
      \`uuid\` VARCHAR(45) NULL,
      PRIMARY KEY (\`id\`));
    `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${env.DB_LOGGER_WORKER_TABLE}\`;
  `);
}
