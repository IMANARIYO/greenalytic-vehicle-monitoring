import { 
  CreatePartnerCategoryDTO, 
  UpdatePartnerCategoryDTO, 
  PartnerCategoryQueryDTO,
  PartnerCategoryResponseDTO,
  PartnerCategoryListResponseDTO,
  CreatePartnerCategoryResponseDTO,
  PartnerCategoryWithPartnersDTO
} from '../../types/webiste/dtos/PartnerCategoryDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import PartnerCategoryRepository from '../../repositories/website/PartnerCategoryRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class PartnerCategoryService {
  
  // Helper function to transform repository result
  private transformPartnerCategory(category: any): PartnerCategoryResponseDTO {
    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      partnersCount: category._count?.partners
    };
  }

  async createPartnerCategory(dto: CreatePartnerCategoryDTO): Promise<CreatePartnerCategoryResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'icon'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreatePartnerCategoryDTO] || dto[field as keyof CreatePartnerCategoryDTO]?.trim().length === 0
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.icon.trim().length > 50) {
        throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Check for duplicate name
      const existingPartnerCategory = await PartnerCategoryRepository.findByName(dto.name.trim());
      if (existingPartnerCategory) {
        throw new AppError('A partner category with this name already exists', HttpStatusCode.CONFLICT);
      }

      // Create partner category
      const partnerCategory = await PartnerCategoryRepository.create({
        name: dto.name.trim(),
        icon: dto.icon.trim()
      });

      logger.info('PartnerCategoryService::createPartnerCategory success', { 
        partnerCategoryId: partnerCategory.id,
        name: partnerCategory.name
      });

      return {
        message: 'Partner category created successfully',
        data: this.transformPartnerCategory(partnerCategory)
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryService::createPartnerCategory', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::createPartnerCategory', appError);
      throw appError;
    }
  }

  async getAllPartnerCategories(params: PaginationParams & {
    search?: string;
    includePartnersCount?: boolean;
  }): Promise<PartnerCategoryListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        includePartnersCount = false,
        sortBy = 'name',
        sortOrder = 'asc'
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
        whereClause.name = {
          contains: search.trim(),
          mode: 'insensitive'
        };
      }

      const result = await PartnerCategoryRepository.findManyWithFilters(
        whereClause, 
        page, 
        limit, 
        sortBy, 
        sortOrder,
        includePartnersCount
      );
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('PartnerCategoryService::getAllPartnerCategories success', { 
        totalCount: result.totalCount,
        page,
        limit,
        includePartnersCount
      });

      return {
        data: result.data.map(category => this.transformPartnerCategory(category)),
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
        logger.error('PartnerCategoryService::getAllPartnerCategories', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch partner categories',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::getAllPartnerCategories', appError);
      throw appError;
    }
  }

  async getPartnerCategoryById(id: number): Promise<PartnerCategoryResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner category ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const partnerCategory = await PartnerCategoryRepository.findById(id);

      if (!partnerCategory) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('PartnerCategoryService::getPartnerCategoryById success', { id });
      return this.transformPartnerCategory(partnerCategory);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryService::getPartnerCategoryById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::getPartnerCategoryById', appError);
      throw appError;
    }
  }

  async getPartnerCategoryWithPartners(id: number): Promise<PartnerCategoryWithPartnersDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner category ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const partnerCategory = await PartnerCategoryRepository.findByIdWithPartners(id);

      if (!partnerCategory) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('PartnerCategoryService::getPartnerCategoryWithPartners success', { 
        id,
        partnersCount: partnerCategory.partners.length 
      });

      return partnerCategory;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryService::getPartnerCategoryWithPartners', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch partner category with partners',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::getPartnerCategoryWithPartners', appError);
      throw appError;
    }
  }

  async updatePartnerCategory(id: number, dto: UpdatePartnerCategoryDTO): Promise<PartnerCategoryResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner category ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if partner category exists
      const existingPartnerCategory = await PartnerCategoryRepository.findById(id);
      if (!existingPartnerCategory) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
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
        const duplicatePartnerCategory = await PartnerCategoryRepository.findByName(dto.name.trim());
        if (duplicatePartnerCategory && duplicatePartnerCategory.id !== id) {
          throw new AppError('A partner category with this name already exists', HttpStatusCode.CONFLICT);
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
      const updateData: UpdatePartnerCategoryDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();

      const updatedPartnerCategory = await PartnerCategoryRepository.update(id, updateData);

      logger.info('PartnerCategoryService::updatePartnerCategory success', { id });
      return this.transformPartnerCategory(updatedPartnerCategory);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryService::updatePartnerCategory', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::updatePartnerCategory', appError);
      throw appError;
    }
  }

  async deletePartnerCategory(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner category ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingPartnerCategory = await PartnerCategoryRepository.findById(id);
      if (!existingPartnerCategory) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
      }

      // Repository will handle checking for existing partners
      await PartnerCategoryRepository.delete(id);

      logger.info('PartnerCategoryService::deletePartnerCategory success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('PartnerCategoryService::deletePartnerCategory', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete partner category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerCategoryService::deletePartnerCategory', appError);
      throw appError;
    }
  }
}

export default new PartnerCategoryService();