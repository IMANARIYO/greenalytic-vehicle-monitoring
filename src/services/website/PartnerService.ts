import { 
  CreatePartnerDTO, 
  UpdatePartnerDTO, 
  PartnerQueryDTO,
  PartnerResponseDTO,
  PartnerListResponseDTO,
  CreatePartnerResponseDTO,
  PartnerWithCategoryDTO
} from '../../types/webiste/dtos/PartnerDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import PartnerRepository from '../../repositories/website/PartnerRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class PartnerService {
  
  private validateUrl(url: string): boolean {
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
  }

  private transformPartner(partner: any): PartnerResponseDTO {
    return {
      id: partner.id,
      name: partner.name,
      description: partner.description,
      logoUrl: partner.logoUrl,
      websiteUrl: partner.websiteUrl,
      categoryId: partner.categoryId,
      keyImpact: partner.keyImpact,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      category: partner.category ? {
        id: partner.category.id,
        name: partner.category.name,
        icon: partner.category.icon
      } : undefined
    };
  }

  async createPartner(dto: CreatePartnerDTO): Promise<CreatePartnerResponseDTO> {
    try {
      const requiredFields = ['name', 'description', 'logoUrl', 'categoryId'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreatePartnerDTO];
        return value === undefined || value === null || 
               (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      if (isNaN(dto.categoryId) || dto.categoryId <= 0) {
        throw new AppError('Category ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      const categoryExists = await PartnerRepository.validateCategoryExists(dto.categoryId);
      if (!categoryExists) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
      }

      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 500) {
        throw new AppError('Description must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.logoUrl.trim().length > 500) {
        throw new AppError('Logo URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (!this.validateUrl(dto.logoUrl.trim())) {
        throw new AppError('Logo URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.websiteUrl && dto.websiteUrl.trim().length > 0) {
        if (dto.websiteUrl.trim().length > 500) {
          throw new AppError('Website URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
        if (!this.validateUrl(dto.websiteUrl.trim())) {
          throw new AppError('Website URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.keyImpact && dto.keyImpact.trim().length > 200) {
        throw new AppError('Key impact must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      const existingPartner = await PartnerRepository.findByNameAndCategory(dto.name.trim(), dto.categoryId);
      if (existingPartner) {
        throw new AppError('A partner with this name already exists in this category', HttpStatusCode.CONFLICT);
      }

      const partner = await PartnerRepository.create({
        name: dto.name.trim(),
        description: dto.description.trim(),
        logoUrl: dto.logoUrl.trim(),
        websiteUrl: dto.websiteUrl?.trim(),
        categoryId: dto.categoryId,
        keyImpact: dto.keyImpact?.trim()
      });

      logger.info('PartnerService::createPartner success', { 
        partnerId: partner.id,
        name: partner.name,
        categoryId: partner.categoryId
      });

      return {
        message: 'Partner created successfully',
        data: this.transformPartner(partner)
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::createPartner', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to create partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::createPartner', appError);
      throw appError;
    }
  }

  async getAllPartners(params: PaginationParams & {
    search?: string;
    categoryId?: number;
    categoryName?: string;
    includeCategory?: boolean;
  }): Promise<PartnerListResponseDTO> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        categoryId,
        categoryName,
        includeCategory = false,
        sortBy = 'name',
        sortOrder = 'asc'
      } = params;

      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new AppError('Sort order must be either "asc" or "desc"', HttpStatusCode.BAD_REQUEST);
      }

      if (categoryId !== undefined && (isNaN(categoryId) || categoryId <= 0)) {
        throw new AppError('Category ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      const allowedSortFields = ['id', 'name', 'createdAt', 'updatedAt'];
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      const whereClause: any = {};

      if (search && search.trim().length > 0) {
        whereClause.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } },
          { keyImpact: { contains: search.trim(), mode: 'insensitive' } }
        ];
      }

      if (categoryId) {
        whereClause.categoryId = categoryId;
      } else if (categoryName && categoryName.trim().length > 0) {
        whereClause.category = {
          name: { contains: categoryName.trim(), mode: 'insensitive' }
        };
      }

      const result = await PartnerRepository.findManyWithFilters(
        whereClause, page, limit, sortBy, sortOrder, includeCategory
      );
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('PartnerService::getAllPartners success', { 
        totalCount: result.totalCount, page, limit, categoryId, categoryName, includeCategory
      });

      return {
        data: result.data.map(partner => this.transformPartner(partner)),
        meta: {
          page, limit, totalItems: result.totalCount, totalPages,
          hasNextPage: page < totalPages, hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined,
          sortBy, sortOrder,
          filters: { categoryId, categoryName }
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::getAllPartners', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to fetch partners',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::getAllPartners', appError);
      throw appError;
    }
  }

  async getPartnerById(id: number): Promise<PartnerResponseDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const partner = await PartnerRepository.findById(id);
      if (!partner) {
        throw new AppError('Partner not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('PartnerService::getPartnerById success', { id });
      return this.transformPartner(partner);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::getPartnerById', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to fetch partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::getPartnerById', appError);
      throw appError;
    }
  }

  async getPartnerWithCategory(id: number): Promise<PartnerWithCategoryDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const partner = await PartnerRepository.findByIdWithCategory(id);
      if (!partner) {
        throw new AppError('Partner not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('PartnerService::getPartnerWithCategory success', { id, categoryId: partner.categoryId });
      return partner;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::getPartnerWithCategory', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to fetch partner with category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::getPartnerWithCategory', appError);
      throw appError;
    }
  }

  async updatePartner(id: number, dto: UpdatePartnerDTO): Promise<PartnerResponseDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingPartner = await PartnerRepository.findById(id);
      if (!existingPartner) {
        throw new AppError('Partner not found', HttpStatusCode.NOT_FOUND);
      }

      if (dto.categoryId !== undefined) {
        if (isNaN(dto.categoryId) || dto.categoryId <= 0) {
          throw new AppError('Category ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
        }
        const categoryExists = await PartnerRepository.validateCategoryExists(dto.categoryId);
        if (!categoryExists) {
          throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
        }
      }

      const updateData: UpdatePartnerDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl.trim();
      if (dto.websiteUrl !== undefined) updateData.websiteUrl = dto.websiteUrl?.trim();
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.keyImpact !== undefined) updateData.keyImpact = dto.keyImpact?.trim();

      const updatedPartner = await PartnerRepository.update(id, updateData);
      logger.info('PartnerService::updatePartner success', { id });
      return this.transformPartner(updatedPartner);
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::updatePartner', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to update partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::updatePartner', appError);
      throw appError;
    }
  }

  async deletePartner(id: number): Promise<boolean> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid partner ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingPartner = await PartnerRepository.findById(id);
      if (!existingPartner) {
        throw new AppError('Partner not found', HttpStatusCode.NOT_FOUND);
      }

      await PartnerRepository.delete(id);
      logger.info('PartnerService::deletePartner success', { id });
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::deletePartner', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to delete partner',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::deletePartner', appError);
      throw appError;
    }
  }

  async getPartnersByCategory(categoryId: number): Promise<PartnerResponseDTO[]> {
    try {
      if (isNaN(categoryId) || categoryId <= 0) {
        throw new AppError('Category ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      const categoryExists = await PartnerRepository.validateCategoryExists(categoryId);
      if (!categoryExists) {
        throw new AppError('Partner category not found', HttpStatusCode.NOT_FOUND);
      }

      const partners = await PartnerRepository.findByCategoryId(categoryId);
      logger.info('PartnerService::getPartnersByCategory success', { categoryId, count: partners.length });
      return partners.map(partner => this.transformPartner(partner));
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('PartnerService::getPartnersByCategory', error);
        throw error;
      }
      const appError = new AppError(
        error.message || 'Failed to fetch partners by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('PartnerService::getPartnersByCategory', appError);
      throw appError;
    }
  }
}

export default new PartnerService();