import { 
  CreateProductDTO, 
  UpdateProductDTO, 
  ProductQueryDTO,
  ProductResponseDTO,
  ProductListResponseDTO,
  CreateProductResponseDTO,
  ProductWithFeaturesResponseDTO
} from '../../types/webiste/dtos/ProductDto.js';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes.js';
import ProductRepository from '../../repositories/website/ProductRepository.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export class ProductService {
  
  async createProduct(dto: CreateProductDTO): Promise<CreateProductResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'content', 'icon', 'iconBackgroundColor'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateProductDTO] || dto[field as keyof CreateProductDTO]?.trim().length === 0
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 200) {
        throw new AppError('Name must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
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

      if (dto.iconBackgroundColor.trim().length > 20) {
        throw new AppError('Icon background color must be 20 characters or less', HttpStatusCode.BAD_REQUEST);
      }



      // Validate hex color format for iconBackgroundColor
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(dto.iconBackgroundColor.trim())) {
        throw new AppError('Icon background color must be a valid hex color (e.g., #FF0000)', HttpStatusCode.BAD_REQUEST);
      }

      // Check for duplicate name
      const existingProduct = await ProductRepository.findByName(dto.name.trim());
      if (existingProduct) {
        throw new AppError('A product with this name already exists', HttpStatusCode.CONFLICT);
      }

      // Create product
      const product = await ProductRepository.create({
        name: dto.name.trim(),
        description: dto.description.trim(),
        content: dto.content.trim(),
        icon: dto.icon.trim(),
        iconBackgroundColor: dto.iconBackgroundColor.trim(),
      });

      logger.info('ProductService::createProduct success', { 
        productId: product.id,
        name: product.name
      });

      return {
        message: 'Product created successfully',
        data: product
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ProductService::createProduct', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::createProduct', appError);
      throw appError;
    }
  }

  async getAllProducts(params: PaginationParams & {
    search?: string;
  }): Promise<ProductListResponseDTO> {
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
              description: {
                contains: search.trim(),
                mode: 'insensitive'
              }
            }
          ]
        });
      }


      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      const result = await ProductRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('ProductService::getAllProducts success', { 
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
        logger.error('ProductService::getAllProducts', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch products',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::getAllProducts', appError);
      throw appError;
    }
  }

  async getProductById(id: number): Promise<ProductResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid product ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const product = await ProductRepository.findById(id);

      if (!product) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('ProductService::getProductById success', { id });
      return product;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ProductService::getProductById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::getProductById', appError);
      throw appError;
    }
  }

  async getProductWithFeatures(id: number): Promise<ProductWithFeaturesResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid product ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const product = await ProductRepository.findByIdWithFeatures(id);

      if (!product) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('ProductService::getProductWithFeatures success', { id });
      return product;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ProductService::getProductWithFeatures', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch product with features',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::getProductWithFeatures', appError);
      throw appError;
    }
  }

  async updateProduct(id: number, dto: UpdateProductDTO): Promise<ProductResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid product ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if product exists
      const existingProduct = await ProductRepository.findById(id);
      if (!existingProduct) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.name !== undefined) {
        if (!dto.name || dto.name.trim().length === 0) {
          throw new AppError('Name cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.name.trim().length > 200) {
          throw new AppError('Name must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate name (excluding current record)
        const duplicateProduct = await ProductRepository.findByName(dto.name.trim());
        if (duplicateProduct && duplicateProduct.id !== id) {
          throw new AppError('A product with this name already exists', HttpStatusCode.CONFLICT);
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

      if (dto.iconBackgroundColor !== undefined) {
        if (!dto.iconBackgroundColor || dto.iconBackgroundColor.trim().length === 0) {
          throw new AppError('Icon background color cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.iconBackgroundColor.trim().length > 20) {
          throw new AppError('Icon background color must be 20 characters or less', HttpStatusCode.BAD_REQUEST);
        }
        
        // Validate hex color format
        const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!hexColorRegex.test(dto.iconBackgroundColor.trim())) {
          throw new AppError('Icon background color must be a valid hex color (e.g., #FF0000)', HttpStatusCode.BAD_REQUEST);
        }
      }


      // Trim string fields if they exist
      const updateData: UpdateProductDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.content !== undefined) updateData.content = dto.content.trim();
      if (dto.icon !== undefined) updateData.icon = dto.icon.trim();
      if (dto.iconBackgroundColor !== undefined) updateData.iconBackgroundColor = dto.iconBackgroundColor.trim();

      const updatedProduct = await ProductRepository.update(id, updateData);

      logger.info('ProductService::updateProduct success', { id });
      return updatedProduct;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ProductService::updateProduct', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::updateProduct', appError);
      throw appError;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid product ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingProduct = await ProductRepository.findById(id);
      if (!existingProduct) {
        throw new AppError('Product not found', HttpStatusCode.NOT_FOUND);
      }

      await ProductRepository.delete(id);

      logger.info('ProductService::deleteProduct success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ProductService::deleteProduct', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete product',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ProductService::deleteProduct', appError);
      throw appError;
    }
  }

}

export default new ProductService();