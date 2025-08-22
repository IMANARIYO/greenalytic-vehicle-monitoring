import { BlogPost, Prisma } from '@prisma/client';
import logger from '../../utils/logger.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import prisma from '../../config/db.js';

interface BlogPostCreateInput {
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl?: string | null;
  authorId: number;
  tags: string[];
  category?: string | null;
}

interface BlogPostUpdateInput {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string;
  imageUrl?: string | null;
  tags?: string[];
  category?: string | null;
}

class BlogPostRepository {
  async create(data: BlogPostCreateInput): Promise<BlogPost> {
    try {
      return await prisma.blogPost.create({
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content,
          summary: data.summary,
          imageUrl: data.imageUrl,
          authorId: data.authorId,
          tags: data.tags,
          category: data.category
        }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::create', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to create blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::create', appError);
      throw appError;
    }
  }

  async findById(id: number): Promise<BlogPost | null> {
    try {
      return await prisma.blogPost.findUnique({
        where: { id }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findById', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog post by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findById', appError);
      throw appError;
    }
  }

  async findByIdWithAuthor(id: number): Promise<any | null> {
    try {
      return await prisma.blogPost.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              image: true
            }
          }
        }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findByIdWithAuthor', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog post with author by ID',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findByIdWithAuthor', appError);
      throw appError;
    }
  }

  async findBySlug(slug: string): Promise<BlogPost | null> {
    try {
      return await prisma.blogPost.findUnique({
        where: { slug }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findBySlug', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog post by slug',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findBySlug', appError);
      throw appError;
    }
  }

  async findBySlugWithAuthor(slug: string): Promise<any | null> {
    try {
      return await prisma.blogPost.findUnique({
        where: { slug },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              image: true
            }
          }
        }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findBySlugWithAuthor', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog post with author by slug',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findBySlugWithAuthor', appError);
      throw appError;
    }
  }

  async findByTitle(title: string): Promise<BlogPost | null> {
    try {
      return await prisma.blogPost.findFirst({
        where: { 
          title: {
            equals: title,
            mode: 'insensitive'
          }
        }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findByTitle', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog post by title',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findByTitle', appError);
      throw appError;
    }
  }

  async findAll(): Promise<BlogPost[]> {
    try {
      return await prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findAll', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find all blog posts',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findAll', appError);
      throw appError;
    }
  }

  async findManyWithFilters(
    whereClause: Prisma.BlogPostWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: BlogPost[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.blogPost.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        prisma.blogPost.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findManyWithFilters', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog posts with filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findManyWithFilters', appError);
      throw appError;
    }
  }

  async findManyWithFiltersIncludeAuthor(
    whereClause: Prisma.BlogPostWhereInput,
    page: number,
    limit: number,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: any[]; totalCount: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, totalCount] = await Promise.all([
        prisma.blogPost.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                image: true
              }
            }
          }
        }),
        prisma.blogPost.count({
          where: whereClause
        })
      ]);

      return { data, totalCount };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findManyWithFiltersIncludeAuthor', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog posts with author filters',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findManyWithFiltersIncludeAuthor', appError);
      throw appError;
    }
  }

  async update(id: number, data: BlogPostUpdateInput): Promise<BlogPost> {
    try {
      const updateData: Prisma.BlogPostUpdateInput = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.slug !== undefined) updateData.slug = data.slug;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.summary !== undefined) updateData.summary = data.summary;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.category !== undefined) updateData.category = data.category;

      return await prisma.blogPost.update({
        where: { id },
        data: updateData
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::update', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to update blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::update', appError);
      throw appError;
    }
  }

  async delete(id: number): Promise<BlogPost> {
    try {
      return await prisma.blogPost.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::delete', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to delete blog post',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::delete', appError);
      throw appError;
    }
  }

  async findByCategory(category: string): Promise<BlogPost[]> {
    try {
      return await prisma.blogPost.findMany({
        where: { 
          category: {
            equals: category,
            mode: 'insensitive'
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findByCategory', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog posts by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findByCategory', appError);
      throw appError;
    }
  }

  async findByTag(tag: string): Promise<BlogPost[]> {
    try {
      return await prisma.blogPost.findMany({
        where: {
          tags: {
            has: tag
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findByTag', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog posts by tag',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findByTag', appError);
      throw appError;
    }
  }

  async findByAuthor(authorId: number): Promise<BlogPost[]> {
    try {
      return await prisma.blogPost.findMany({
        where: { authorId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::findByAuthor', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to find blog posts by author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::findByAuthor', appError);
      throw appError;
    }
  }

  async getAllCategories(): Promise<string[]> {
    try {
      const result = await prisma.blogPost.findMany({
        select: {
          category: true
        },
        distinct: ['category'],
        where: {
          category: {
            not: null
          }
        },
        orderBy: {
          category: 'asc'
        }
      });
      
      return result.map(item => item.category as string);
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::getAllCategories', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to get all categories',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::getAllCategories', appError);
      throw appError;
    }
  }

  async getAllTags(): Promise<string[]> {
    try {
      const result = await prisma.blogPost.findMany({
        select: {
          tags: true
        }
      });
      
      // Flatten all tags and get unique values
      const allTags = result.flatMap(item => item.tags);
      return [...new Set(allTags)].sort();
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::getAllTags', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to get all tags',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::getAllTags', appError);
      throw appError;
    }
  }

  async count(): Promise<number> {
    try {
      return await prisma.blogPost.count();
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::count', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to count blog posts',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::count', appError);
      throw appError;
    }
  }

  async countByCategory(category: string): Promise<number> {
    try {
      return await prisma.blogPost.count({
        where: { 
          category: {
            equals: category,
            mode: 'insensitive'
          }
        }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::countByCategory', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to count blog posts by category',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::countByCategory', appError);
      throw appError;
    }
  }

  async countByAuthor(authorId: number): Promise<number> {
    try {
      return await prisma.blogPost.count({
        where: { authorId }
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const appError = handlePrismaError(error);
        logger.error('BlogPostRepository::countByAuthor', appError);
        throw appError;
      }
      const appError = new AppError(
        error.message || 'Failed to count blog posts by author',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('BlogPostRepository::countByAuthor', appError);
      throw appError;
    }
  }
}

export default new BlogPostRepository();