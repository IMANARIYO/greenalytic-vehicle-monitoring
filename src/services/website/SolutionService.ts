import { 
  CreateSolutionDTO, 
  UpdateSolutionDTO, 
  SolutionQueryDTO,
  SolutionResponseDTO,
  SolutionListResponseDTO,
  CreateSolutionResponseDTO,
  SolutionWithTestimonialsResponseDTO,
  SolutionWithTestimonialsListResponseDTO,
} from '../../types/webiste/dtos/SolutionDto';
import { SolutionType } from '@prisma/client';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import SolutionRepository from '../../repositories/website/SolutionRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class SolutionService {
  
  async createSolution(dto: CreateSolutionDTO): Promise<CreateSolutionResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['title', 'subtitle', 'description', 'content', 'icon', 'type'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreateSolutionDTO];
        return !value || (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.title.trim().length > 200) {
        throw new AppError('Title must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.subtitle.trim().length > 300) {
        throw new AppError('Subtitle must be 300 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 1000) {
        throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.content.trim().length > 10000) {
        throw new AppError('Content must be 10000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.icon.trim().length > 500) {
        throw new AppError('Icon must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate solution type
      if (!Object.values(SolutionType).includes(dto.type)) {
        throw new AppError(`Invalid solution type. Must be one of: ${Object.values(SolutionType).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Check for duplicate title
      const existingSolution = await SolutionRepository.findByTitle(dto.title.trim());
      if (existingSolution) {
        throw new AppError('A solution with this title already exists', HttpStatusCode.CONFLICT);
      }

      // Create solution
      const solution = await SolutionRepository.create({
        title: dto.title.trim(),
        subtitle: dto.subtitle.trim(),
        description: dto.description.trim(),
        content: dto.content.trim(),
        icon: dto.icon.trim(),
        type: dto.type
      });

      logger.info('SolutionService::createSolution success', { 
        solutionId: solution.id,
        title: solution.title,
        type: solution.type
      });

      return {
        message: 'Solution created successfully',
        data: solution
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::createSolution', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::createSolution', appError);
      throw appError;
    }
  }

  async getAllSolutions(params: PaginationParams & {
    search?: string;
    type?: SolutionType;
    includeTestimonials?: boolean;
  }): Promise<SolutionListResponseDTO | SolutionWithTestimonialsListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        type,
        includeTestimonials = false,
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
      const allowedSortFields = ['id', 'title', 'type', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate solution type if provided
      if (type !== undefined && !Object.values(SolutionType).includes(type)) {
        throw new AppError(`Invalid solution type. Must be one of: ${Object.values(SolutionType).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Build where clause for filtering
      const whereClause: any = {};
      const andConditions: any[] = [];

      // Search filtering
      if (search && search.trim().length > 0) {
        andConditions.push({
          OR: [
            {
              title: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            },
            {
              subtitle: {
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
          ]
        });
      }

      // Type filtering
      if (type !== undefined) {
        andConditions.push({
          type: type
        });
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      let result;
      if (includeTestimonials) {
        result = await SolutionRepository.findManyWithFiltersIncludeTestimonials(whereClause, page, limit, sortBy, sortOrder);
      } else {
        result = await SolutionRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      }

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('SolutionService::getAllSolutions success', { 
        totalCount: result.totalCount,
        page,
        limit,
        includeTestimonials
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
        logger.error('SolutionService::getAllSolutions', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solutions',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getAllSolutions', appError);
      throw appError;
    }
  }

  async getSolutionById(id: number): Promise<SolutionResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid solution ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const solution = await SolutionRepository.findById(id);

      if (!solution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('SolutionService::getSolutionById success', { id });
      return solution;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getSolutionById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getSolutionById', appError);
      throw appError;
    }
  }

  async getSolutionWithTestimonials(id: number): Promise<SolutionWithTestimonialsResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid solution ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const solution = await SolutionRepository.findByIdWithTestimonials(id);

      if (!solution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('SolutionService::getSolutionWithTestimonials success', { id });
      return solution;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getSolutionWithTestimonials', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solution with testimonials',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getSolutionWithTestimonials', appError);
      throw appError;
    }
  }

  async updateSolution(id: number, dto: UpdateSolutionDTO): Promise<SolutionResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid solution ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if solution exists
      const existingSolution = await SolutionRepository.findById(id);
      if (!existingSolution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.title !== undefined) {
        if (!dto.title || dto.title.trim().length === 0) {
          throw new AppError('Title cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.title.trim().length > 200) {
          throw new AppError('Title must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate title (excluding current record)
        const duplicateSolution = await SolutionRepository.findByTitle(dto.title.trim());
        if (duplicateSolution && duplicateSolution.id !== id) {
          throw new AppError('A solution with this title already exists', HttpStatusCode.CONFLICT);
        }
      }

      if (dto.subtitle !== undefined) {
        if (!dto.subtitle || dto.subtitle.trim().length === 0) {
          throw new AppError('Subtitle cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.subtitle.trim().length > 300) {
          throw new AppError('Subtitle must be 300 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.description !== undefined) {
        if (!dto.description || dto.description.trim().length === 0) {
          throw new AppError('Description cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.description.trim().length > 1000) {
          throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.content !== undefined) {
        if (!dto.content || dto.content.trim().length === 0) {
          throw new AppError('Content cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.content.trim().length > 10000) {
          throw new AppError('Content must be 10000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.icon !== undefined) {
        if (!dto.icon || dto.icon.trim().length === 0) {
          throw new AppError('Icon cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.icon.trim().length > 500) {
          throw new AppError('Icon must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
        
      }

      if (dto.type !== undefined) {
        if (!Object.values(SolutionType).includes(dto.type)) {
          throw new AppError(`Invalid solution type. Must be one of: ${Object.values(SolutionType).join(', ')}`, HttpStatusCode.BAD_REQUEST);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateSolutionDTO = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.subtitle !== undefined) updateData.subtitle = dto.subtitle.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.content !== undefined) updateData.content = dto.content.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();
      if (dto.type !== undefined) updateData.type = dto.type;

      const updatedSolution = await SolutionRepository.update(id, updateData);

      logger.info('SolutionService::updateSolution success', { id });
      return updatedSolution;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::updateSolution', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::updateSolution', appError);
      throw appError;
    }
  }

  async deleteSolution(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid solution ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingSolution = await SolutionRepository.findById(id);
      if (!existingSolution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      await SolutionRepository.delete(id);

      logger.info('SolutionService::deleteSolution success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::deleteSolution', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::deleteSolution', appError);
      throw appError;
    }
  }

  async getSolutionsByType(type: SolutionType): Promise<SolutionResponseDTO[]> {
    try {
      if (!Object.values(SolutionType).includes(type)) {
        throw new AppError(`Invalid solution type. Must be one of: ${Object.values(SolutionType).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      const solutions = await SolutionRepository.findByType(type);

      logger.info('SolutionService::getSolutionsByType success', { 
        type,
        count: solutions.length
      });

      return solutions;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getSolutionsByType', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solutions by type',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getSolutionsByType', appError);
      throw appError;
    }
  }

  async getSolutionTypes(): Promise<SolutionType[]> {
    try {
      const types = await SolutionRepository.getSolutionTypes();

      logger.info('SolutionService::getSolutionTypes success', { 
        count: types.length
      });

      return types;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getSolutionTypes', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solution types',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getSolutionTypes', appError);
      throw appError;
    }
  }

  async getTypesInUse(): Promise<SolutionType[]> {
    try {
      const types = await SolutionRepository.getTypesInUse();

      logger.info('SolutionService::getTypesInUse success', { 
        count: types.length
      });

      return types;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getTypesInUse', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch solution types in use',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getTypesInUse', appError);
      throw appError;
    }
  }

  async getSolutionCountByType(type: SolutionType): Promise<number> {
    try {
      if (!Object.values(SolutionType).includes(type)) {
        throw new AppError(`Invalid solution type. Must be one of: ${Object.values(SolutionType).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      const count = await SolutionRepository.countByType(type);

      logger.info('SolutionService::getSolutionCountByType success', { 
        type,
        count
      });

      return count;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('SolutionService::getSolutionCountByType', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count solutions by type',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('SolutionService::getSolutionCountByType', appError);
      throw appError;
    }
  }
}

export default new SolutionService();