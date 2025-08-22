import { 
  CreateBlogPostDTO, 
  UpdateBlogPostDTO, 
  BlogPostQueryDTO,
  BlogPostResponseDTO,
  BlogPostListResponseDTO,
  CreateBlogPostResponseDTO,
  BlogPostWithAuthorResponseDTO,
  BlogPostWithAuthorListResponseDTO,
  BlogAnalyticsResponseDTO
} from '../../types/webiste/dtos/BlogPostDto.js';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes.js';
import BlogPostRepository from '../../repositories/website/BlogPostRepository.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import prisma from '../../config/db.js';

export class BlogPostService {
  
  async createBlogPost(dto: CreateBlogPostDTO): Promise<CreateBlogPostResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['title', 'slug', 'content', 'summary', 'authorId'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreateBlogPostDTO];
        return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.title.trim().length > 500) {
        throw new AppError('Title must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.slug.trim().length > 500) {
        throw new AppError('Slug must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.summary.trim().length > 1000) {
        throw new AppError('Summary must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.content.trim().length > 50000) {
        throw new AppError('Content must be 50000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.imageUrl && dto.imageUrl.trim().length > 1000) {
        throw new AppError('Image URL must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.category && dto.category.trim().length > 100) {
        throw new AppError('Category must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate slug format (URL-friendly)
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(dto.slug.trim())) {
        throw new AppError('Slug must contain only lowercase letters, numbers, and hyphens', HttpStatusCode.BAD_REQUEST);
      }

      // Validate tags
      if (dto.tags && dto.tags.length > 20) {
        throw new AppError('Maximum 20 tags allowed', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.tags) {
        for (const tag of dto.tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new AppError('All tags must be non-empty strings', HttpStatusCode.BAD_REQUEST);
          }
          if (tag.trim().length > 50) {
            throw new AppError('Each tag must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
          }
        }
      }

      // Check if author exists
      const author = await prisma.user.findUnique({
        where: { id: dto.authorId }
      });
      if (!author) {
        throw new AppError('Author not found', HttpStatusCode.NOT_FOUND);
      }

      // Check for duplicate slug
      const existingBlogPost = await BlogPostRepository.findBySlug(dto.slug.trim().toLowerCase());
      if (existingBlogPost) {
        throw new AppError('A blog post with this slug already exists', HttpStatusCode.CONFLICT);
      }

      // Check for duplicate title
      const existingTitle = await BlogPostRepository.findByTitle(dto.title.trim());
      if (existingTitle) {
        throw new AppError('A blog post with this title already exists', HttpStatusCode.CONFLICT);
      }

      // Create blog post
      const blogPost = await BlogPostRepository.create({
        title: dto.title.trim(),
        slug: dto.slug.trim().toLowerCase(),
        content: dto.content.trim(),
        summary: dto.summary.trim(),
        imageUrl: dto.imageUrl?.trim() || null,
        authorId: dto.authorId,
        tags: dto.tags?.map(tag => tag.trim()) || [],
        category: dto.category?.trim() || null
      });

      logger.info('BlogPostService::createBlogPost success', { 
        blogPostId: blogPost.id,
        title: blogPost.title,
        slug: blogPost.slug,
        authorId: blogPost.authorId
      });

      return {
        message: 'Blog post created successfully',
        data: blogPost
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::createBlogPost', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to create blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::createBlogPost', appError);
      throw appError;
    }
  }

  async getAllBlogPosts(params: PaginationParams & {
    search?: string;
    category?: string;
    tags?: string[];
    authorId?: number;
    includeAuthor?: boolean;
  }): Promise<BlogPostListResponseDTO | BlogPostWithAuthorListResponseDTO> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        tags,
        authorId,
        includeAuthor = false,
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
      const allowedSortFields = ['id', 'title', 'slug', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate authorId if provided
      if (authorId !== undefined && (isNaN(authorId) || authorId <= 0)) {
        throw new AppError('Invalid author ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
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
              summary: {
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

      // Category filtering
      if (category !== undefined && category.trim().length > 0) {
        andConditions.push({
          category: {
            equals: category.trim(),
            mode: 'insensitive'
          }
        });
      }

      // Tags filtering
      if (tags && tags.length > 0) {
        andConditions.push({
          tags: {
            hasSome: tags.map(tag => tag.trim())
          }
        });
      }

      // Author filtering
      if (authorId !== undefined) {
        andConditions.push({
          authorId: authorId
        });
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      let result;
      if (includeAuthor) {
        result = await BlogPostRepository.findManyWithFiltersIncludeAuthor(whereClause, page, limit, sortBy, sortOrder);
      } else {
        result = await BlogPostRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      }

      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('BlogPostService::getAllBlogPosts success', { 
        totalCount: result.totalCount,
        page,
        limit,
        includeAuthor
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
      if (error instanceof AppError) {
        logger.error('BlogPostService::getAllBlogPosts', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog posts',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getAllBlogPosts', appError);
      throw appError;
    }
  }

  async getBlogPostById(id: number): Promise<BlogPostResponseDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid blog post ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const blogPost = await BlogPostRepository.findById(id);

      if (!blogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('BlogPostService::getBlogPostById success', { id });
      return blogPost;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostById', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostById', appError);
      throw appError;
    }
  }

  async getBlogPostWithAuthor(id: number): Promise<BlogPostWithAuthorResponseDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid blog post ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const blogPost = await BlogPostRepository.findByIdWithAuthor(id);

      if (!blogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('BlogPostService::getBlogPostWithAuthor success', { id });
      return blogPost;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostWithAuthor', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog post with author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostWithAuthor', appError);
      throw appError;
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPostResponseDTO> {
    try {
      if (!slug || slug.trim().length === 0) {
        throw new AppError('Slug cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const blogPost = await BlogPostRepository.findBySlug(slug.trim().toLowerCase());

      if (!blogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('BlogPostService::getBlogPostBySlug success', { slug });
      return blogPost;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostBySlug', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog post by slug',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostBySlug', appError);
      throw appError;
    }
  }

  async getBlogPostBySlugWithAuthor(slug: string): Promise<BlogPostWithAuthorResponseDTO> {
    try {
      if (!slug || slug.trim().length === 0) {
        throw new AppError('Slug cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const blogPost = await BlogPostRepository.findBySlugWithAuthor(slug.trim().toLowerCase());

      if (!blogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('BlogPostService::getBlogPostBySlugWithAuthor success', { slug });
      return blogPost;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostBySlugWithAuthor', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog post by slug with author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostBySlugWithAuthor', appError);
      throw appError;
    }
  }

  async updateBlogPost(id: number, dto: UpdateBlogPostDTO): Promise<BlogPostResponseDTO> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid blog post ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if blog post exists
      const existingBlogPost = await BlogPostRepository.findById(id);
      if (!existingBlogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.title !== undefined) {
        if (!dto.title || dto.title.trim().length === 0) {
          throw new AppError('Title cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.title.trim().length > 500) {
          throw new AppError('Title must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate title (excluding current record)
        const duplicateBlogPost = await BlogPostRepository.findByTitle(dto.title.trim());
        if (duplicateBlogPost && duplicateBlogPost.id !== id) {
          throw new AppError('A blog post with this title already exists', HttpStatusCode.CONFLICT);
        }
      }

      if (dto.slug !== undefined) {
        if (!dto.slug || dto.slug.trim().length === 0) {
          throw new AppError('Slug cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.slug.trim().length > 500) {
          throw new AppError('Slug must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Validate slug format
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(dto.slug.trim())) {
          throw new AppError('Slug must contain only lowercase letters, numbers, and hyphens', HttpStatusCode.BAD_REQUEST);
        }

        // Check for duplicate slug (excluding current record)
        const duplicateSlug = await BlogPostRepository.findBySlug(dto.slug.trim().toLowerCase());
        if (duplicateSlug && duplicateSlug.id !== id) {
          throw new AppError('A blog post with this slug already exists', HttpStatusCode.CONFLICT);
        }
      }

      if (dto.content !== undefined) {
        if (!dto.content || dto.content.trim().length === 0) {
          throw new AppError('Content cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.content.trim().length > 50000) {
          throw new AppError('Content must be 50000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.summary !== undefined) {
        if (!dto.summary || dto.summary.trim().length === 0) {
          throw new AppError('Summary cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.summary.trim().length > 1000) {
          throw new AppError('Summary must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.imageUrl !== undefined && dto.imageUrl !== null && dto.imageUrl.trim().length > 1000) {
        throw new AppError('Image URL must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.category !== undefined && dto.category !== null && dto.category.trim().length > 100) {
        throw new AppError('Category must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate tags
      if (dto.tags !== undefined) {
        if (dto.tags.length > 20) {
          throw new AppError('Maximum 20 tags allowed', HttpStatusCode.BAD_REQUEST);
        }

        for (const tag of dto.tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0) {
            throw new AppError('All tags must be non-empty strings', HttpStatusCode.BAD_REQUEST);
          }
          if (tag.trim().length > 50) {
            throw new AppError('Each tag must be 50 characters or less', HttpStatusCode.BAD_REQUEST);
          }
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateBlogPostDTO = {};
      if (dto.title !== undefined) updateData.title = dto.title.trim();
      if (dto.slug !== undefined) updateData.slug = dto.slug.trim().toLowerCase();
      if (dto.content !== undefined) updateData.content = dto.content.trim();
      if (dto.summary !== undefined) updateData.summary = dto.summary.trim();
      if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl?.trim() || null;
      if (dto.tags !== undefined) updateData.tags = dto.tags.map(tag => tag.trim());
      if (dto.category !== undefined) updateData.category = dto.category?.trim() || null;

      const updatedBlogPost = await BlogPostRepository.update(id, updateData);

      logger.info('BlogPostService::updateBlogPost success', { id });
      return updatedBlogPost;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::updateBlogPost', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to update blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::updateBlogPost', appError);
      throw appError;
    }
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid blog post ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingBlogPost = await BlogPostRepository.findById(id);
      if (!existingBlogPost) {
        throw new AppError('Blog post not found', HttpStatusCode.NOT_FOUND);
      }

      await BlogPostRepository.delete(id);

      logger.info('BlogPostService::deleteBlogPost success', { id });
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::deleteBlogPost', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to delete blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::deleteBlogPost', appError);
      throw appError;
    }
  }

  async getBlogPostsByCategory(category: string): Promise<BlogPostResponseDTO[]> {
    try {
      if (!category || category.trim().length === 0) {
        throw new AppError('Category cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const blogPosts = await BlogPostRepository.findByCategory(category.trim());

      logger.info('BlogPostService::getBlogPostsByCategory success', { 
        category,
        count: blogPosts.length
      });

      return blogPosts;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostsByCategory', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog posts by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostsByCategory', appError);
      throw appError;
    }
  }

  async getBlogPostsByTag(tag: string): Promise<BlogPostResponseDTO[]> {
    try {
      if (!tag || tag.trim().length === 0) {
        throw new AppError('Tag cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const blogPosts = await BlogPostRepository.findByTag(tag.trim());

      logger.info('BlogPostService::getBlogPostsByTag success', { 
        tag,
        count: blogPosts.length
      });

      return blogPosts;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostsByTag', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog posts by tag',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostsByTag', appError);
      throw appError;
    }
  }

  async getBlogPostsByAuthor(authorId: number): Promise<BlogPostResponseDTO[]> {
    try {
      if (isNaN(authorId) || authorId <= 0) {
        throw new AppError('Invalid author ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const blogPosts = await BlogPostRepository.findByAuthor(authorId);

      logger.info('BlogPostService::getBlogPostsByAuthor success', { 
        authorId,
        count: blogPosts.length
      });

      return blogPosts;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostsByAuthor', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog posts by author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostsByAuthor', appError);
      throw appError;
    }
  }

  async getAllCategories(): Promise<string[]> {
    try {
      const categories = await BlogPostRepository.getAllCategories();

      logger.info('BlogPostService::getAllCategories success', { 
        count: categories.length
      });

      return categories;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getAllCategories', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog categories',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getAllCategories', appError);
      throw appError;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const tags = await BlogPostRepository.getAllTags();

      logger.info('BlogPostService::getAllTags success', { 
        count: tags.length
      });

      return tags;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getAllTags', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog tags',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getAllTags', appError);
      throw appError;
    }
  }

  async getBlogAnalytics(): Promise<BlogAnalyticsResponseDTO> {
    try {
      const [categories, tags, totalPosts] = await Promise.all([
        BlogPostRepository.getAllCategories(),
        BlogPostRepository.getAllTags(),
        BlogPostRepository.count()
      ]);

      // Get category counts
     const categoryAnalytics: { category: string | null; count: number; }[] = await Promise.all(
        categories.map(async (category) => {
          const count = await BlogPostRepository.countByCategory(category);
          return { category, count };
        })
      );

      // Add null category count
      const nullCategoryCount = await prisma.blogPost.count({
        where: { category: null }
      });
      if (nullCategoryCount > 0) {
        categoryAnalytics.push({ category: null as string | null, count: nullCategoryCount });
      }

      // For tags, we need to count occurrences manually since it's an array field
      const allBlogPosts = await BlogPostRepository.findAll();
      const tagCounts: { [key: string]: number } = {};
      
      allBlogPosts.forEach(post => {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const tagAnalytics = Object.entries(tagCounts).map(([tag, count]) => ({
        tag,
        count
      })).sort((a, b) => b.count - a.count);

      logger.info('BlogPostService::getBlogAnalytics success', { 
        totalPosts,
        categoriesCount: categoryAnalytics.length,
        tagsCount: tagAnalytics.length
      });

      return {
        categories: categoryAnalytics,
        tags: tagAnalytics,
        totalPosts
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogAnalytics', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to fetch blog analytics',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogAnalytics', appError);
      throw appError;
    }
  }

  async getBlogPostCountByCategory(category: string): Promise<number> {
    try {
      if (!category || category.trim().length === 0) {
        throw new AppError('Category cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const count = await BlogPostRepository.countByCategory(category.trim());

      logger.info('BlogPostService::getBlogPostCountByCategory success', { 
        category,
        count
      });

      return count;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostCountByCategory', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to count blog posts by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostCountByCategory', appError);
      throw appError;
    }
  }

  async getBlogPostCountByAuthor(authorId: number): Promise<number> {
    try {
      if (isNaN(authorId) || authorId <= 0) {
        throw new AppError('Invalid author ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const count = await BlogPostRepository.countByAuthor(authorId);

      logger.info('BlogPostService::getBlogPostCountByAuthor success', { 
        authorId,
        count
      });

      return count;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('BlogPostService::getBlogPostCountByAuthor', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to count blog posts by author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostService::getBlogPostCountByAuthor', appError);
      throw appError;
    }
  }
}

export default new BlogPostService();