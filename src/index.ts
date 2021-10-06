import { ApplicationEnv, AppLogger, conditionalPresenceValidator, enumInclusionValidator, IAppLogger, isPlainObject, JSONParser, LoggerType, LogType, StandardLogger } from 'kalmia-common-lib';
import { env, IEnv } from './config/env';
import {
  ConnectionStrategy, DbConnectionType, DbModelStatus, IConnectionDetails, PopulateFor,
  SerializeFor
} from './config/types';
import { BaseModel } from './modules/common/base.model';
import { foreignKeyExistence, uniqueFieldValue } from './modules/common/validators';
import { MySqlConnManager } from './modules/db-connection/mysql-conn-manager';
import { MySqlUtil } from './modules/db-connection/mysql-util';
import {
  buildSearchParameter, buildWhereCondition, getQueryParams, selectAndCountQuery, SqlQueryObject, unionSelectAndCountQuery, WhereQueryComparator
} from './modules/db-connection/sql-utils';
import { MigrationOptions, Migrations } from './modules/migrations/migrations';
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

  isPlainObject,

  uniqueFieldValue,
  enumInclusionValidator,
  conditionalPresenceValidator,
  JSONParser,
  foreignKeyExistence,

  IEnv,
  env,

  MySqlStage,
};
