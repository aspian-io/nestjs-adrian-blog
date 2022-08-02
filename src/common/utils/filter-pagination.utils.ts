export class FilterPaginationUtil {

  /**
   * Generate skip and take parameters from limit and page query strings.
   * 
   * @param limit - The limit which has been received from querystring
   * @param page - the page number which has been received from querystring
   * @returns An object of the type {@link ISkipTakeGenerator}
   */
  static takeSkipGenerator ( limit: number = 10, page: number = 1 ): ISkipTakeGenerator {
    return {
      skip: limit * ( page - 1 ),
      take: limit
    };
  }

  /**
   * Result object generator for filter and pagination
   * 
   * @param items - Resulted items
   * @param totalItems - Number of all items
   * @param limit - Number of items per page
   * @param page - Number of page
   * @returns An object of the type {@link IListResultGenerator<T>}
   */
  static resultGenerator<T> ( items: T[], totalItems: number, limit: number, page: number ): IListResultGenerator<T> {
    return {
      meta: {
        totalPages: Math.ceil( totalItems / limit ),
        currentPage: page,
        itemCount: items.length,
        totalItems,
        itemsPerPage: limit
      },
      items
    };
  }

}

// Function Return Type
export interface IListResultGenerator<T> {
  meta: IResultGeneratorMeta;
  items: T[];
}

export interface IResultGeneratorMeta {
  totalPages: number;
  currentPage: number;
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
}

// Skip Take Generator Return Type
export interface ISkipTakeGenerator {
  skip: number;
  take: number;
}