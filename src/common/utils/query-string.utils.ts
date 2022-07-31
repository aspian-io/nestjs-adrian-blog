import * as moment from "moment";
import { FindOperator, ILike } from "typeorm";

export class QueryStringUtil {

  /**
   * Extract and make ready to use search querystring
   * 
   * @param query - Search querystring
   * @returns Ready to use search string with % wildcards
   */
  static extractSearchString ( query: string ): FindOperator<string> {
    return ILike( `%${ query.trim() }%` );
  }

  /**
   * Extract page number from querystring
   * 
   * @param pageQuery - Querystring
   * @returns Page number
   */
  static extractPage ( pageQuery: string ): number {
    return +pageQuery > 0 ? Math.ceil( +pageQuery ) : 1;
  }

  /**
   * Extract limit number from querystring
   * 
   * @param limitQuery - limit querystring
   * @param defaultLimit - Default limit number
   * @param maxLimit - Maximum limit number
   * @returns Limit number
   */
  static extractLimit (
    limitQuery: string,
    defaultLimit: number = 10,
    maxLimit: number = 100
  ): number {
    let limit: number = +limitQuery > 0 ? Math.ceil( +limitQuery ) : defaultLimit;
    if ( limit > maxLimit ) limit = maxLimit;

    return limit;
  }

  /**
   * Extract Order
   * 
   * @param query - Value of type ASC | DESC
   * @returns 'ASC' or 'DESC' or undefined
   */
  static extractOrder ( query: string ) {
    if ( [ 'ASC', 'DESC' ].includes( query ) ) return query;
    return undefined;
  }

  /**
   * Extract comma-separated strings from a querystring
   * 
   * @param query - Querystring
   * @returns An array of strings
   */
  static extractCommaSeparatedStrings ( query: string ): string[] {
    return query.toString().split( ',' );
  }

  /**
   * Extract number range from querystring
   * 
   * @param query - Number rang querystring
   * @returns An array of two numbers
   */
  static extractCommaSeparatedNumberRange ( query: string ): number[] {
    return query.toString().split( ',' ).length === 2
      ? query.toString().split( ',' ).map( s => +s )
      : [];
  }

  /**
   * Extract date range from querystring
   * 
   * @param query - Date range querystring
   * @returns An array of ISO-string dates
   */
  static extractCommaSeparatedDateRange ( query: string ): Date[] {
    let dateRangeValues: string[] = query.toString().split( ',' );
    if (
      dateRangeValues.length === 2
      && moment( dateRangeValues[ 0 ], "YYYY-MM-DD", true ).isValid()
      && moment( dateRangeValues[ 1 ], "YYYY-MM-DD", true ).isValid()
    ) {
      const dateRange: Date[] = [];
      dateRange.push( new Date( dateRangeValues[ 0 ] ) );
      dateRange.push( new Date( dateRangeValues[ 1 ] ) );

      return dateRangeValues.length ? dateRange : [];
    }
    return [];
  }

  /**
   * Extract value based on allowed values as an array
   * 
   * @param query - Querystring
   * @param allowedValues - Allowed string values
   * @returns value or null
   */
  static extractValueBasedOn ( query: string, allowedValues: string[] ): string {
    return allowedValues.includes( query ) ? query : undefined;
  }

  /**
   * Extract array of values based on allowed values as an array
   * 
   * @param query - Querystring
   * @param allowedValues - Allowed string values
   * @returns values or an empty array
   */
  static extractValuesListBasedOn ( query: string, allowedValues: string[] ): string[] {
    const queryArr = query.toString().split( ',' );
    if ( queryArr.length ) {
      return queryArr.filter( e => allowedValues.includes( e ) );
    }
    return [];
  }

  /**
   * Extract boolean value from querystring
   * 
   * @param query - Querystring
   * @returns boolean
   */
  static toBoolean ( query: string ): boolean {
    query = query.toLowerCase();

    return query === 'true' || query === '1' ? true : false;
  }

  /**
   * Convert querystring value to number
   * 
   * @param query - Querystring
   * @param opts - Parameter of the type {@link IToNumberOptions} to specify min, max and default number
   * @returns A number
   */
  static toNumber ( query: string, opts: IToNumberOptions = {} ): number {
    let newValue: number = Number.parseInt( query || String( opts.default ), 10 );

    if ( Number.isNaN( newValue ) ) {
      newValue = opts.default;
    }

    if ( opts.min ) {
      if ( newValue < opts.min ) {
        newValue = opts.min;
      }

      if ( newValue > opts.max ) {
        newValue = opts.max;
      }
    }
    return newValue;
  }

  /**
   * Convert string to lowercase
   * 
   * @param query - Querystring
   * @returns A lowercase string
   */
  static toLowerCase ( query: string ): string {
    return query.toLowerCase();
  }

  /**
   * Trim the string
   * 
   * @param query - Querystring
   * @returns A trimmed string
   */
  static trim ( query: string ): string {
    return query.trim();
  }

  /**
   * Convert string date to Date type
   * 
   * @param query - Querystring
   * @returns A date or null
   */
  static toDate ( query: string ): Date | null {
    if ( !moment( query ).isValid() ) return null;
    return new Date( query );
  }
}

/*********/
/* Types */
/*********/

// Sort values type
export interface ISortValues {
  sortField: string;
  sortMethod: 'ASC' | 'DESC';
}

//
interface IToNumberOptions {
  default?: number;
  min?: number;
  max?: number;
}