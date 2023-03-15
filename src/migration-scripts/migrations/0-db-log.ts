import { env } from '../../config/env';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${env.DB_LOGGER_TABLE}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`ts\` DATETIME DEFAULT CURRENT_TIMESTAMP,
      \`file\` VARCHAR(1000) NULL,
      \`method\` VARCHAR(1000) NULL,
      \`severity\` VARCHAR(255) NULL,
      \`data\` TEXT NULL,
      PRIMARY KEY (\`id\`));
    `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${env.DB_LOGGER_TABLE}\`;
  `);
}
