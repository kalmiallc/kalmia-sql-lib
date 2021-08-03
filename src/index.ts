import { MySqlConnManager } from './modules/db-connection/mysql-conn-manager';
import { MySqlUtil } from './modules/db-connection/mysql-util';
import { BaseModel } from './modules/common/base.model';
import { Migrations, MigrationOptions } from './modules/migrations/migrations';
import {
  LoggerType,
  LogType,
  ConnectionStrategy,
  ApplicationEnv,
  PopulateFor,
  SerializeFor,
  DbConnectionType,
  IConnectionDetails,
  DbModelStatus
} from './config/types';
import { AppLogger, IAppLogger } from './modules/logger/app-logger';
import { StandardLogger } from './modules/logger/logger';
import { Context } from './modules/common/context';

import { uniqueFieldValue, enumInclusionValidator, conditionalPresenceValidator } from './modules/common/validators';
import { isPlainObject } from './modules/common/utils';

import {
  WhereQueryComparator,
  SqlQueryObject,
  getQueryParams,
  buildSearchParameter,
  selectAndCountQuery,
  unionSelectAndCountQuery,
  buildWhereCondition
} from './modules/db-connection/sql-utils';

import { IEnv, env } from './config/env';

import { MySqlStage } from './modules/test-helpers/mysql-stage';

export {
  MySqlConnManager,
  MySqlUtil,
  BaseModel,
  Migrations,
  MigrationOptions,

  WhereQueryComparator,
  SqlQueryObject,
  getQueryParams,
  buildSearchParameter,
  selectAndCountQuery,
  unionSelectAndCountQuery,
  buildWhereCondition,

  LoggerType,
  LogType,
  ConnectionStrategy,
  ApplicationEnv,
  PopulateFor,
  SerializeFor,
  DbConnectionType,
  IConnectionDetails,
  DbModelStatus,

  AppLogger,
  IAppLogger,
  StandardLogger,
  Context,

  isPlainObject,

  uniqueFieldValue,
  enumInclusionValidator,
  conditionalPresenceValidator,

  IEnv,
  env,

  MySqlStage,
};
