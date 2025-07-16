import { 
  CreateFeatureDTO, 
  UpdateFeatureDTO, 
  FeatureQueryDTO,
  FeatureResponseDTO,
  FeatureListResponseDTO,
  CreateFeatureResponseDTO,
  FeatureWithProductResponseDTO,
  FeatureWithProductListResponseDTO
} from '../../types/webiste/dtos/FeatureDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import FeatureRepository from '../../repositories/website/FeatureRepository';
import ProductRepository from '../../repositories/website/ProductRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class FeatureService {
  
  async createFeature(dto: CreateFeatureDTO): Promise<CreateFeatureResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['title', 'description', 'icon', 'productId'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreateFeatureDTO];
        if (field === 'productId') {
          return !value || isNaN(value as number) || (value as number) <= 0;
        }
        return !value || (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.title.trim().length > 200) {
        throw new AppError('Title must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 1000) {
        throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.icon.trim().length > 50) {
        throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate productId
      if (isNaN(dto.productId) || dto.productId <= 0) {
        throw new AppError('Product ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      // Check if product exists
      const existingProduct = await ProductRepository.findById(dto.productId);
      if (!existingProduct) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      // Check for duplicate title within the same product
      const existingFeature = await FeatureRepository.findByTitle(dto.title.trim(), dto.productId);
      if (existingFeature) {
        throw new AppError('A feature with this title already exists for this product', HttpStatusCode.CONFLICT);
      }

      // Create feature
      const feature = await FeatureRepository.create({
        title: dto.title.trim(),
        description: dto.description.trim(),
        icon: dto.icon.trim(),
        productId: dto.productId
      });

      logger.info('FeatureService::createFeature success', { 
        featureId: feature.id,
        title: feature.title,
        productId: feature.productId
      });

      return {
        message: 'Feature created successfully',
        data: feature
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::createFeature', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::createFeature', appError);
      throw appError;
    }
  }

  async getAllFeatures(params: PaginationParams & {
    search?: string;
    productId?: number;
    includeProduct?: boolean;
  }): Promise<FeatureListResponseDTO | FeatureWithProductListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        productId,
        includeProduct = false,
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

      // Validate productId if provided
      if (productId !== undefined) {
        if (isNaN(productId) || productId <= 0) {
          throw new AppError('Product ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
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
          ]
        });
      }

      // Product filtering
      if (productId !== undefined) {
        andConditions.push({
          productId: productId
        });
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      let result;
      if (includeProduct) {
        result = await FeatureRepository.findManyWithFiltersIncludeProduct(whereClause, page, limit, sortBy, sortOrder);
      } else {
        result = await FeatureRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      }

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('FeatureService::getAllFeatures success', { 
        totalCount: result.totalCount,
        page,
        limit,
        includeProduct
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
        logger.error('FeatureService::getAllFeatures', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch features',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::getAllFeatures', appError);
      throw appError;
    }
  }

  async getFeatureById(id: number): Promise<FeatureResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid feature ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const feature = await FeatureRepository.findById(id);

      if (!feature) {
        throw new AppError('Feature not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('FeatureService::getFeatureById success', { id });
      return feature;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::getFeatureById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::getFeatureById', appError);
      throw appError;
    }
  }

  async getFeatureWithProduct(id: number): Promise<FeatureWithProductResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid feature ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const feature = await FeatureRepository.findByIdWithProduct(id);

      if (!feature) {
        throw new AppError('Feature not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('FeatureService::getFeatureWithProduct success', { id });
      return feature;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::getFeatureWithProduct', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch feature with product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::getFeatureWithProduct', appError);
      throw appError;
    }
  }

  async updateFeature(id: number, dto: UpdateFeatureDTO): Promise<FeatureResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid feature ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if feature exists
      const existingFeature = await FeatureRepository.findById(id);
      if (!existingFeature) {
        throw new AppError('Feature not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.title !== undefined) {
        if (!dto.title || dto.title.trim().length === 0) {
          throw new AppError('Title cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.title.trim().length > 200) {
          throw new AppError('Title must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate title within the same product (excluding current record)
        const productIdToCheck = dto.productId !== undefined ? dto.productId : existingFeature.productId;
        const duplicateFeature = await FeatureRepository.findByTitle(dto.title.trim(), productIdToCheck);
        if (duplicateFeature && duplicateFeature.id !== id) {
          throw new AppError('A feature with this title already exists for this product', HttpStatusCode.CONFLICT);
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

      if (dto.icon !== undefined) {
        if (!dto.icon || dto.icon.trim().length === 0) {
          throw new AppError('Icon cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.icon.trim().length > 50) {
          throw new AppError('Icon must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.productId !== undefined) {
        if (isNaN(dto.productId) || dto.productId <= 0) {
          throw new AppError('Product ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
        }

        // Check if new product exists
        const newProduct = await ProductRepository.findById(dto.productId);
        if (!newProduct) {
          throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateFeatureDTO = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();
      if (dto.productId !== undefined) updateData.productId = dto.productId;

      const updatedFeature = await FeatureRepository.update(id, updateData);

      logger.info('FeatureService::updateFeature success', { id });
      return updatedFeature;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::updateFeature', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::updateFeature', appError);
      throw appError;
    }
  }

  async deleteFeature(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid feature ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingFeature = await FeatureRepository.findById(id);
      if (!existingFeature) {
        throw new AppError('Feature not found', HttpStatusCode.NOT_FOUND);
      }

      await FeatureRepository.delete(id);

      logger.info('FeatureService::deleteFeature success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::deleteFeature', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete feature',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::deleteFeature', appError);
      throw appError;
    }
  }

  async getFeaturesByProductId(productId: number): Promise<FeatureResponseDTO[]> {
    try {
      if (isNaN(productId) || productId <= 0) {
        throw new AppError('Product ID must be a positive integer', HttpStatusCode.BAD_REQUEST);
      }

      // Check if product exists
      const existingProduct = await ProductRepository.findById(productId);
      if (!existingProduct) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      const features = await FeatureRepository.findByProductId(productId);

      logger.info('FeatureService::getFeaturesByProductId success', { 
        productId,
        count: features.length
      });

      return features;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('FeatureService::getFeaturesByProductId', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch features by product ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('FeatureService::getFeaturesByProductId', appError);
      throw appError;
    }
  }
}

export default new FeatureService();