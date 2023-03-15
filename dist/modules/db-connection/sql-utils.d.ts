import { MySqlUtil } from './mysql-util';
export declare enum WhereQueryComparator {
    EQUAL = 0,
    LESS_THAN = 1,
    LESS_THAN_OR_EQUAL = 2,
    MORE_THAN = 3,
    MORE_THAN_OR_EQUAL = 4,
    NOT_EQUAL = 5,
    IN = 6,
    NOT_IN = 7,
    HAS_TEXT = 8,
    IN_TEXT = 9
}
export interface SqlQueryObject {
    /**
     * 'Select' part of query
     */
    qSelect: string;
    /**
     * 'From' part of query
     */
    qFrom: string;
    /**
     * 'GROUP' part of query
     */
    qGroup?: string;
    /**
     * 'ORDER BY' and 'LIMIT - OFFSET' part of query
     */
    qFilter?: string;
}
/**
 * Function returns object for database query parameters
 *
 * @export
 * @param defaultParameters  Key-value object. All expected parameters should be listed, value can be null.
 * @param tableAlias table alias name
 * @param fieldMap URL query fields mapped with database query fields.
 * @param urlQuery URL query parameters.
 * @returns Object with parameters for database listing search.
 */
export declare const getQueryParams: (defaultParameters: any, tableAlias: string, fieldMap: any, urlQuery: any) => {
    params: any;
    filters: {
        limit: number;
        offset: number;
        order: any[];
        orderStr: any;
    };
};
export declare const buildSearchParameter: (searchString: any, fields: string[]) => string;
export declare const selectAndCountQuery: (db: MySqlUtil, queryObj: SqlQueryObject, params: any, countByField: string) => Promise<{
    items: any[];
    total: number;
}>;
export declare const unionSelectAndCountQuery: (db: MySqlUtil, queryObj: any, params: any, countByField: string) => Promise<{
    items: any[];
    total: number;
}>;
export declare const buildWhereCondition: (comparator: WhereQueryComparator, field: string, param: string) => string;
//# sourceMappingURL=sql-utils.d.ts.map