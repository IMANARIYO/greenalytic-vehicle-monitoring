import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import BlogPostService from '../../services/website/BlogPostService.js';
import { CreateBlogPostDTO, UpdateBlogPostDTO, BlogPostQueryDTO } from '../../types/webiste/dtos/BlogPostDto.js';

class BlogPostController {

  constructor() {
  }

  createBlogPost = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const dto: CreateBlogPostDTO = {
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content,
      summary: req.body.summary,
      imageUrl: req.body.imageUrl,
      authorId: req.body.authorId,
      tags: req.body.tags || [],
      category: req.body.category
    };

    const result = await BlogPostService.createBlogPost(dto);
    return Response.created(res, result, 'Blog post created successfully');
  });

  getAllBlogPosts = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: BlogPostQueryDTO & { includeAuthor?: boolean } = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      category: req.query.category as string,
      tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
      authorId: req.query.authorId ? parseInt(req.query.authorId as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      includeAuthor: req.query.includeAuthor === 'true'
    };

    const result = await BlogPostService.getAllBlogPosts(query);
    return Response.success(res, result, 'Blog posts retrieved successfully');
  });

  getBlogPostById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await BlogPostService.getBlogPostById(id);
    return Response.success(res, result, 'Blog post retrieved successfully');
  });

  getBlogPostWithAuthor = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await BlogPostService.getBlogPostWithAuthor(id);
    return Response.success(res, result, 'Blog post with author retrieved successfully');
  });

  getBlogPostBySlug = catchAsync(async (req: Request, res: ExpressResponse) => {
    const slug = req.params.slug;
    const result = await BlogPostService.getBlogPostBySlug(slug);
    return Response.success(res, result, 'Blog post retrieved successfully');
  });

  getBlogPostBySlugWithAuthor = catchAsync(async (req: Request, res: ExpressResponse) => {
    const slug = req.params.slug;
    const result = await BlogPostService.getBlogPostBySlugWithAuthor(slug);
    return Response.success(res, result, 'Blog post with author retrieved successfully');
  });

  updateBlogPost = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateBlogPostDTO = {
      title: req.body.title,
      slug: req.body.slug,
      content: req.body.content,
      summary: req.body.summary,
      imageUrl: req.body.imageUrl,
      tags: req.body.tags,
      category: req.body.category
    };

    const result = await BlogPostService.updateBlogPost(id, dto);
    return Response.success(res, result, 'Blog post updated successfully');
  });

  deleteBlogPost = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await BlogPostService.deleteBlogPost(id);
    return Response.success(res, null, 'Blog post deleted successfully');
  });

  getBlogPostsByCategory = catchAsync(async (req: Request, res: ExpressResponse) => {
    const category = req.params.category;
    const result = await BlogPostService.getBlogPostsByCategory(category);
    return Response.success(res, result, 'Blog posts by category retrieved successfully');
  });

  getBlogPostsByTag = catchAsync(async (req: Request, res: ExpressResponse) => {
    const tag = req.params.tag;
    const result = await BlogPostService.getBlogPostsByTag(tag);
    return Response.success(res, result, 'Blog posts by tag retrieved successfully');
  });

  getBlogPostsByAuthor = catchAsync(async (req: Request, res: ExpressResponse) => {
    const authorId = parseInt(req.params.authorId);
    const result = await BlogPostService.getBlogPostsByAuthor(authorId);
    return Response.success(res, result, 'Blog posts by author retrieved successfully');
  });

  getAllCategories = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await BlogPostService.getAllCategories();
    return Response.success(res, result, 'Blog categories retrieved successfully');
  });

  getAllTags = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await BlogPostService.getAllTags();
    return Response.success(res, result, 'Blog tags retrieved successfully');
  });

  getBlogAnalytics = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await BlogPostService.getBlogAnalytics();
    return Response.success(res, result, 'Blog analytics retrieved successfully');
  });

  getBlogPostCountByCategory = catchAsync(async (req: Request, res: ExpressResponse) => {
    const category = req.params.category;
    const result = await BlogPostService.getBlogPostCountByCategory(category);
    return Response.success(res, { count: result }, 'Blog post count by category retrieved successfully');
  });

  getBlogPostCountByAuthor = catchAsync(async (req: Request, res: ExpressResponse) => {
    const authorId = parseInt(req.params.authorId);
    const result = await BlogPostService.getBlogPostCountByAuthor(authorId);
    return Response.success(res, { count: result }, 'Blog post count by author retrieved successfully');
  });
}

export default new BlogPostController();