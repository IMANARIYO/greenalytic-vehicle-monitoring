import { 
  CreatePartnershipReasonDTO, 
  UpdatePartnershipReasonDTO, 
  PartnershipReasonQueryDTO,
  PartnershipReasonResponseDTO,
  PartnershipReasonListResponseDTO,
  CreatePartnershipReasonResponseDTO
} from '../../types/webiste/dtos/PartnershipReasonDto.js';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes.js';
import PartnershipReasonRepository from '../../repositories/website/PartnershipReasonRepository.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export class PartnershipReasonService {
  
  async createPartnershipReason(dto: CreatePartnershipReasonDTO): Promise<CreatePartnershipReasonResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['title', 'description', 'icon'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreatePartnershipReasonDTO] || dto[field as keyof CreatePartnershipReasonDTO]?.trim().length === 0
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
      const existingPartnershipReason = await PartnershipReasonRepository.findByTitle(dto.title.trim());
      if (existingPartnershipReason) {
        throw new AppError('A partnership reason with this title already exists', HttpStatusCode.CONFLICT);
      }

      // Create partnership reason
      const partnershipReason = await PartnershipReasonRepository.create({
        title: dto.title.trim(),
        description: dto.description.trim(),
        icon: dto.icon.trim()
      });

      logger.info('PartnershipReasonService::createPartnershipReason success', { 
        partnershipReasonId: partnershipReason.id,
        title: partnershipReason.title
      });

      return {
        message: 'Partnership reason created successfully',
        data: partnershipReason
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnershipReasonService::createPartnershipReason', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonService::createPartnershipReason', appError);
      throw appError;
    }
  }

  async getAllPartnershipReasons(params: PaginationParams & {
    search?: string;
  }): Promise<PartnershipReasonListResponseDTO> {
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

      const result = await PartnershipReasonRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('PartnershipReasonService::getAllPartnershipReasons success', { 
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
        logger.error('PartnershipReasonService::getAllPartnershipReasons', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch partnership reasons',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonService::getAllPartnershipReasons', appError);
      throw appError;
    }
  }

  async getPartnershipReasonById(id: number): Promise<PartnershipReasonResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partnership reason ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const partnershipReason = await PartnershipReasonRepository.findById(id);

      if (!partnershipReason) {
        throw new AppError('Partnership reason not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('PartnershipReasonService::getPartnershipReasonById success', { id });
      return partnershipReason;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnershipReasonService::getPartnershipReasonById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonService::getPartnershipReasonById', appError);
      throw appError;
    }
  }

  async updatePartnershipReason(id: number, dto: UpdatePartnershipReasonDTO): Promise<PartnershipReasonResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partnership reason ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if partnership reason exists
      const existingPartnershipReason = await PartnershipReasonRepository.findById(id);
      if (!existingPartnershipReason) {
        throw new AppError('Partnership reason not found', HttpStatusCode.NOT_FOUND);
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
        const duplicatePartnershipReason = await PartnershipReasonRepository.findByTitle(dto.title.trim());
        if (duplicatePartnershipReason && duplicatePartnershipReason.id !== id) {
          throw new AppError('A partnership reason with this title already exists', HttpStatusCode.CONFLICT);
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
      const updateData: UpdatePartnershipReasonDTO = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();

      const updatedPartnershipReason = await PartnershipReasonRepository.update(id, updateData);

      logger.info('PartnershipReasonService::updatePartnershipReason success', { id });
      return updatedPartnershipReason;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnershipReasonService::updatePartnershipReason', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonService::updatePartnershipReason', appError);
      throw appError;
    }
  }

  async deletePartnershipReason(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partnership reason ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingPartnershipReason = await PartnershipReasonRepository.findById(id);
      if (!existingPartnershipReason) {
        throw new AppError('Partnership reason not found', HttpStatusCode.NOT_FOUND);
      }

      await PartnershipReasonRepository.delete(id);

      logger.info('PartnershipReasonService::deletePartnershipReason success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnershipReasonService::deletePartnershipReason', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete partnership reason',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnershipReasonService::deletePartnershipReason', appError);
      throw appError;
    }
  }
}

export default new PartnershipReasonService();