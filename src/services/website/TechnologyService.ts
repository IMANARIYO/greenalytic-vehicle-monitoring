import { 
  CreateTechnologyDTO, 
  UpdateTechnologyDTO, 
  TechnologyQueryDTO,
  TechnologyResponseDTO,
  TechnologyListResponseDTO,
  CreateTechnologyResponseDTO
} from '../../types/webiste/dtos/TechnologyDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import TechnologyRepository from '../../repositories/website/TechnologyRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class TechnologyService {
  
  async createTechnology(dto: CreateTechnologyDTO): Promise<CreateTechnologyResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'icon'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateTechnologyDTO] || dto[field as keyof CreateTechnologyDTO]?.trim().length === 0
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 500) {
        throw new AppError('Description must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.icon.trim().length > 50) {
        throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Check for duplicate name
      const existingTechnology = await TechnologyRepository.findByName(dto.name.trim());
      if (existingTechnology) {
        throw new AppError('A technology with this name already exists', HttpStatusCode.CONFLICT);
      }

      // Create technology
      const technology = await TechnologyRepository.create({
        name: dto.name.trim(),
        description: dto.description.trim(),
        icon: dto.icon.trim()
      });

      logger.info('TechnologyService::createTechnology success', { 
        technologyId: technology.id,
        name: technology.name
      });

      return {
        message: 'Technology created successfully',
        data: technology
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TechnologyService::createTechnology', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyService::createTechnology', appError);
      throw appError;
    }
  }

  async getAllTechnologies(params: PaginationParams & {
    search?: string;
  }): Promise<TechnologyListResponseDTO> {
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
      const allowedSortFields = ['id', 'name', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Build where clause for filtering
      const whereClause: any = {};

      // Search filtering
      if (search && search.trim().length > 0) {
        whereClause.OR = [
          {
            name: {
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

      const result = await TechnologyRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('TechnologyService::getAllTechnologies success', { 
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
        logger.error('TechnologyService::getAllTechnologies', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch technologies',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyService::getAllTechnologies', appError);
      throw appError;
    }
  }

  async getTechnologyById(id: number): Promise<TechnologyResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid technology ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const technology = await TechnologyRepository.findById(id);

      if (!technology) {
        throw new AppError('Technology not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('TechnologyService::getTechnologyById success', { id });
      return technology;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TechnologyService::getTechnologyById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyService::getTechnologyById', appError);
      throw appError;
    }
  }

  async updateTechnology(id: number, dto: UpdateTechnologyDTO): Promise<TechnologyResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid technology ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if technology exists
      const existingTechnology = await TechnologyRepository.findById(id);
      if (!existingTechnology) {
        throw new AppError('Technology not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.name !== undefined) {
        if (!dto.name || dto.name.trim().length === 0) {
          throw new AppError('Name cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.name.trim().length > 100) {
          throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate name (excluding current record)
        const duplicateTechnology = await TechnologyRepository.findByName(dto.name.trim());
        if (duplicateTechnology && duplicateTechnology.id !== id) {
          throw new AppError('A technology with this name already exists', HttpStatusCode.CONFLICT);
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
      const updateData: UpdateTechnologyDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();

      const updatedTechnology = await TechnologyRepository.update(id, updateData);

      logger.info('TechnologyService::updateTechnology success', { id });
      return updatedTechnology;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TechnologyService::updateTechnology', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyService::updateTechnology', appError);
      throw appError;
    }
  }

  async deleteTechnology(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid technology ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingTechnology = await TechnologyRepository.findById(id);
      if (!existingTechnology) {
        throw new AppError('Technology not found', HttpStatusCode.NOT_FOUND);
      }

      await TechnologyRepository.delete(id);

      logger.info('TechnologyService::deleteTechnology success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TechnologyService::deleteTechnology', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete technology',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TechnologyService::deleteTechnology', appError);
      throw appError;
    }
  }
}

export default new TechnologyService();