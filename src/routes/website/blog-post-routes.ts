import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import BlogPostController from '../../controllers/website/BlogPostController.js';

export const BlogPostRouter = Router();

const blogPostController = BlogPostController;

// CREATE ROUTES
// Create blog post - Admin only
BlogPostRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    blogPostController.createBlogPost(req, res, next);
  }
);

// READ ROUTES
// Get all blog posts - Public access
BlogPostRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getAllBlogPosts(req, res, next);
  }
);

// Get all blog categories - Public access
BlogPostRouter.get(
  '/categories',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getAllCategories(req, res, next);
  }
);

// Get all blog tags - Public access
BlogPostRouter.get(
  '/tags',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getAllTags(req, res, next);
  }
);

// Get blog analytics - Public access
BlogPostRouter.get(
  '/analytics',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogAnalytics(req, res, next);
  }
);

// Get blog posts by category - Public access
BlogPostRouter.get(
  '/category/:category',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostsByCategory(req, res, next);
  }
);

// Get blog post count by category - Public access
BlogPostRouter.get(
  '/category/:category/count',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostCountByCategory(req, res, next);
  }
);

// Get blog posts by tag - Public access
BlogPostRouter.get(
  '/tag/:tag',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostsByTag(req, res, next);
  }
);

// Get blog posts by author - Public access
BlogPostRouter.get(
  '/author/:authorId',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostsByAuthor(req, res, next);
  }
);

// Get blog post count by author - Public access
BlogPostRouter.get(
  '/author/:authorId/count',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostCountByAuthor(req, res, next);
  }
);

// Get blog post by slug - Public access
BlogPostRouter.get(
  '/slug/:slug',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostBySlug(req, res, next);
  }
);

// Get blog post by slug with author - Public access
BlogPostRouter.get(
  '/slug/:slug/author',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostBySlugWithAuthor(req, res, next);
  }
);

// Get blog post by ID - Public access
BlogPostRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostById(req, res, next);
  }
);

// Get blog post with author by ID - Public access
BlogPostRouter.get(
  '/:id/author',
  (req: Request, res: Response, next: NextFunction) => {
    blogPostController.getBlogPostWithAuthor(req, res, next);
  }
);

// UPDATE ROUTES
// Update blog post - Admin only
BlogPostRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    blogPostController.updateBlogPost(req, res, next);
  }
);

// Patch blog post - Admin only
BlogPostRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    blogPostController.updateBlogPost(req, res, next);
  }
);

// DELETE ROUTES
// Delete blog post - Admin only
BlogPostRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    blogPostController.deleteBlogPost(req, res, next);
  }
);