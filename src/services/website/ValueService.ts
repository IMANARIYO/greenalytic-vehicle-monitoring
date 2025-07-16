import { 
  CreateValueDTO, 
  UpdateValueDTO, 
  ValueQueryDTO,
  ValueResponseDTO,
  ValueListResponseDTO,
  CreateValueResponseDTO
} from '../../types/webiste/dtos/ValueDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import ValueRepository from '../../repositories/website/ValueRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class ValueService {
  
  async createValue(dto: CreateValueDTO): Promise<CreateValueResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['title', 'description', 'icon'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateValueDTO] || dto[field as keyof CreateValueDTO]?.trim().length === 0
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.title.trim().length > 100) {
        throw new AppError('Title must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 500) {
        throw new AppError('Description must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.icon.trim().length > 50) {
        throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Check for duplicate title
      const existingValue = await ValueRepository.findByTitle(dto.title.trim());
      if (existingValue) {
        throw new AppError('A value with this title already exists', HttpStatusCode.CONFLICT);
      }

      // Create value
      const value = await ValueRepository.create({
        title: dto.title.trim(),
        description: dto.description.trim(),
        icon: dto.icon.trim()
      });

      logger.info('ValueService::createValue success', { 
        valueId: value.id,
        title: value.title
      });

      return {
        message: 'Value created successfully',
        data: value
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ValueService::createValue', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create value',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ValueService::createValue', appError);
      throw appError;
    }
  }

  async getAllValues(params: PaginationParams & {
    search?: string;
  }): Promise<ValueListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortOrder
      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new AppError('Sort order must be either "asc" or "desc"', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = ['id', 'title', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Build where clause for filtering
      const whereClause: any = {};

      // Search filtering
      if (search && search.trim().length > 0) {
        whereClause.OR = [
          {
            title: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        ];
      }

      const result = await ValueRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('ValueService::getAllValues success', { 
        totalCount: result.totalCount,
        page,
        limit 
      });

      return {
        data: result.data,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined,
          sortBy,
          sortOrder
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ValueService::getAllValues', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch values',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ValueService::getAllValues', appError);
      throw appError;
    }
  }

  async getValueById(id: number): Promise<ValueResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid value ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const value = await ValueRepository.findById(id);

      if (!value) {
        throw new AppError('Value not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('ValueService::getValueById success', { id });
      return value;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ValueService::getValueById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch value',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ValueService::getValueById', appError);
      throw appError;
    }
  }

  async updateValue(id: number, dto: UpdateValueDTO): Promise<ValueResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid value ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if value exists
      const existingValue = await ValueRepository.findById(id);
      if (!existingValue) {
        throw new AppError('Value not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.title !== undefined) {
        if (!dto.title || dto.title.trim().length === 0) {
          throw new AppError('Title cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.title.trim().length > 100) {
          throw new AppError('Title must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate title (excluding current record)
        const duplicateValue = await ValueRepository.findByTitle(dto.title.trim());
        if (duplicateValue && duplicateValue.id !== id) {
          throw new AppError('A value with this title already exists', HttpStatusCode.CONFLICT);
        }
      }

      if (dto.description !== undefined) {
        if (!dto.description || dto.description.trim().length === 0) {
          throw new AppError('Description cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.description.trim().length > 500) {
          throw new AppError('Description must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.icon !== undefined) {
        if (!dto.icon || dto.icon.trim().length === 0) {
          throw new AppError('Icon cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.icon.trim().length > 50) {
          throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateValueDTO = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();

      const updatedValue = await ValueRepository.update(id, updateData);

      logger.info('ValueService::updateValue success', { id });
      return updatedValue;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ValueService::updateValue', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update value',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ValueService::updateValue', appError);
      throw appError;
    }
  }

  async deleteValue(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid value ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingValue = await ValueRepository.findById(id);
      if (!existingValue) {
        throw new AppError('Value not found', HttpStatusCode.NOT_FOUND);
      }

      await ValueRepository.delete(id);

      logger.info('ValueService::deleteValue success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ValueService::deleteValue', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete value',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ValueService::deleteValue', appError);
      throw appError;
    }
  }
}

export default new ValueService();