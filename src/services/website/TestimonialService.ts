import { 
  CreateTestimonialDTO, 
  UpdateTestimonialDTO, 
  TestimonialQueryDTO,
  TestimonialResponseDTO,
  TestimonialListResponseDTO,
  CreateTestimonialResponseDTO,
  TestimonialWithSolutionResponseDTO,
  TestimonialWithSolutionListResponseDTO
} from '../../types/webiste/dtos/TestimonialDto.js';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes.js';
import TestimonialRepository from '../../repositories/website/TestimonialRepository.js';
import SolutionRepository from '../../repositories/website/SolutionRepository.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export class TestimonialService {
  
  async createTestimonial(dto: CreateTestimonialDTO): Promise<CreateTestimonialResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'position', 'company', 'content', 'solutionId'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreateTestimonialDTO];
        if (field === 'solutionId') {
          return !value || isNaN(value as number) || (value as number) <= 0;
        }
        return !value || (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.position.trim().length > 100) {
        throw new AppError('Position must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.company.trim().length > 100) {
        throw new AppError('Company must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.content.trim().length > 1000) {
        throw new AppError('Content must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.imageUrl && dto.imageUrl.trim().length > 500) {
        throw new AppError('Image URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate URL format for imageUrl if provided
      if (dto.imageUrl && dto.imageUrl.trim().length > 0) {
        try {
          new URL(dto.imageUrl.trim());
        } catch (error) {
          throw new AppError('Invalid image URL format', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Validate solutionId
      if (isNaN(dto.solutionId) || dto.solutionId <= 0) {
        throw new AppError('Solution ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      // Check if solution exists
      const existingSolution = await SolutionRepository.findById(dto.solutionId);
      if (!existingSolution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      // Create testimonial
      const testimonial = await TestimonialRepository.create({
        name: dto.name.trim(),
        position: dto.position.trim(),
        company: dto.company.trim(),
        content: dto.content.trim(),
        imageUrl: dto.imageUrl ? dto.imageUrl.trim() : undefined,
        solutionId: dto.solutionId
      });

      logger.info('TestimonialService::createTestimonial success', { 
        testimonialId: testimonial.id,
        name: testimonial.name,
        solutionId: testimonial.solutionId
      });

      return {
        message: 'Testimonial created successfully',
        data: testimonial
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::createTestimonial', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::createTestimonial', appError);
      throw appError;
    }
  }

  async getAllTestimonials(params: PaginationParams & {
    search?: string;
    solutionId?: number;
    company?: string;
    includeSolution?: boolean;
  }): Promise<TestimonialListResponseDTO | TestimonialWithSolutionListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        solutionId,
        company,
        includeSolution = false,
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
      const allowedSortFields = ['id', 'name', 'company', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate solutionId if provided
      if (solutionId !== undefined) {
        if (isNaN(solutionId) || solutionId <= 0) {
          throw new AppError('Solution ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Build where clause for filtering
      const whereClause: any = {};
      const andConditions: any[] = [];

      // Search filtering
      if (search && search.trim().length > 0) {
        andConditions.push({
          OR: [
            {
              name: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            },
            {
              position: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            },
            {
              company: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            },
            {
              content: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            }
          ]
        });
      }

      // Solution filtering
      if (solutionId !== undefined) {
        andConditions.push({
          solutionId: solutionId
        });
      }

      // Company filtering
      if (company && company.trim().length > 0) {
        andConditions.push({
          company: {
            equals: company.trim(),
            mode: 'insensitive'
          }
        });
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      let result;
      if (includeSolution) {
        result = await TestimonialRepository.findManyWithFiltersIncludeSolution(whereClause, page, limit, sortBy, sortOrder);
      } else {
        result = await TestimonialRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      }

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('TestimonialService::getAllTestimonials success', { 
        totalCount: result.totalCount,
        page,
        limit,
        includeSolution
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
        logger.error('TestimonialService::getAllTestimonials', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch testimonials',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getAllTestimonials', appError);
      throw appError;
    }
  }

  async getTestimonialById(id: number): Promise<TestimonialResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const testimonial = await TestimonialRepository.findById(id);

      if (!testimonial) {
        throw new AppError('Testimonial not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('TestimonialService::getTestimonialById success', { id });
      return testimonial;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getTestimonialById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getTestimonialById', appError);
      throw appError;
    }
  }

  async getTestimonialWithSolution(id: number): Promise<TestimonialWithSolutionResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const testimonial = await TestimonialRepository.findByIdWithSolution(id);

      if (!testimonial) {
        throw new AppError('Testimonial not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('TestimonialService::getTestimonialWithSolution success', { id });
      return testimonial;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getTestimonialWithSolution', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch testimonial with solution',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getTestimonialWithSolution', appError);
      throw appError;
    }
  }

  async updateTestimonial(id: number, dto: UpdateTestimonialDTO): Promise<TestimonialResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if testimonial exists
      const existingTestimonial = await TestimonialRepository.findById(id);
      if (!existingTestimonial) {
        throw new AppError('Testimonial not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.name !== undefined) {
        if (!dto.name || dto.name.trim().length === 0) {
          throw new AppError('Name cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.name.trim().length > 100) {
          throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.position !== undefined) {
        if (!dto.position || dto.position.trim().length === 0) {
          throw new AppError('Position cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.position.trim().length > 100) {
          throw new AppError('Position must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.company !== undefined) {
        if (!dto.company || dto.company.trim().length === 0) {
          throw new AppError('Company cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.company.trim().length > 100) {
          throw new AppError('Company must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.content !== undefined) {
        if (!dto.content || dto.content.trim().length === 0) {
          throw new AppError('Content cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.content.trim().length > 1000) {
          throw new AppError('Content must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.imageUrl !== undefined) {
        if (dto.imageUrl && dto.imageUrl.trim().length > 500) {
          throw new AppError('Image URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
        
        // Validate URL format if provided and not empty
        if (dto.imageUrl && dto.imageUrl.trim().length > 0) {
          try {
            new URL(dto.imageUrl.trim());
          } catch (error) {
            throw new AppError('Invalid image URL format', HttpStatusCode.BAD_REQUEST);
          }
        }
      }

      if (dto.solutionId !== undefined) {
        if (isNaN(dto.solutionId) || dto.solutionId <= 0) {
          throw new AppError('Solution ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
        }

        // Check if new solution exists
        const newSolution = await SolutionRepository.findById(dto.solutionId);
        if (!newSolution) {
          throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateTestimonialDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.position !== undefined) updateData.position = dto.position.trim();
      if (dto.company !== undefined) updateData.company = dto.company.trim();
      if (dto.content !== undefined) updateData.content = dto.content.trim();
      if (dto.imageUrl !== undefined) {
        updateData.imageUrl = dto.imageUrl && dto.imageUrl.trim().length > 0 ? dto.imageUrl.trim() : undefined;
      }
      if (dto.solutionId !== undefined) updateData.solutionId = dto.solutionId;

      const updatedTestimonial = await TestimonialRepository.update(id, updateData);

      logger.info('TestimonialService::updateTestimonial success', { id });
      return updatedTestimonial;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::updateTestimonial', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::updateTestimonial', appError);
      throw appError;
    }
  }

  async deleteTestimonial(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid testimonial ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingTestimonial = await TestimonialRepository.findById(id);
      if (!existingTestimonial) {
        throw new AppError('Testimonial not found', HttpStatusCode.NOT_FOUND);
      }

      await TestimonialRepository.delete(id);

      logger.info('TestimonialService::deleteTestimonial success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::deleteTestimonial', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete testimonial',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::deleteTestimonial', appError);
      throw appError;
    }
  }

  async getTestimonialsBySolutionId(solutionId: number): Promise<TestimonialResponseDTO[]> {
    try {
      if (isNaN(solutionId) || solutionId <= 0) {
        throw new AppError('Solution ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      // Check if solution exists
      const existingSolution = await SolutionRepository.findById(solutionId);
      if (!existingSolution) {
        throw new AppError('Solution not found', HttpStatusCode.NOT_FOUND);
      }

      const testimonials = await TestimonialRepository.findBySolutionId(solutionId);

      logger.info('TestimonialService::getTestimonialsBySolutionId success', { 
        solutionId,
        count: testimonials.length
      });

      return testimonials;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getTestimonialsBySolutionId', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch testimonials by solution ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getTestimonialsBySolutionId', appError);
      throw appError;
    }
  }

  async getTestimonialsByCompany(company: string): Promise<TestimonialResponseDTO[]> {
    try {
      if (!company || company.trim().length === 0) {
        throw new AppError('Company cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const testimonials = await TestimonialRepository.findByCompany(company.trim());

      logger.info('TestimonialService::getTestimonialsByCompany success', { 
        company: company.trim(),
        count: testimonials.length
      });

      return testimonials;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getTestimonialsByCompany', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch testimonials by company',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getTestimonialsByCompany', appError);
      throw appError;
    }
  }

  async getUniqueCompanies(): Promise<string[]> {
    try {
      const companies = await TestimonialRepository.getUniqueCompanies();

      logger.info('TestimonialService::getUniqueCompanies success', { 
        count: companies.length
      });

      return companies;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getUniqueCompanies', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch unique companies',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getUniqueCompanies', appError);
      throw appError;
    }
  }

  async getTestimonialCountBySolutionId(solutionId: number): Promise<number> {
    try {
      if (isNaN(solutionId) || solutionId <= 0) {
        throw new AppError('Solution ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      const count = await TestimonialRepository.countBySolutionId(solutionId);

      logger.info('TestimonialService::getTestimonialCountBySolutionId success', { 
        solutionId,
        count
      });

      return count;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TestimonialService::getTestimonialCountBySolutionId', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to count testimonials by solution ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TestimonialService::getTestimonialCountBySolutionId', appError);
      throw appError;
    }
  }
}

export default new TestimonialService();