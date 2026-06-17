import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationOptions, PaginationResult } from '../interfaces/pagination.interface';

export class PaginationUtil {
  static async paginate<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
  ): Promise<PaginationResult<T>> {
    const { page, limit, sortBy, sortOrder } = options;

    // Apply sorting
    if (sortBy) {
      queryBuilder.orderBy(`${queryBuilder.alias}.${sortBy}`, sortOrder || 'ASC');
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results and count
    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  static createPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
}