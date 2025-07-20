import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import TestimonialController from '../../controllers/website/TestimonialController.js';

export const TestimonialRouter = Router();

const testimonialController = TestimonialController;

// CREATE ROUTES
// Create testimonial - Admin only
TestimonialRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.createTestimonial(req, res, next);
  }
);

// READ ROUTES
// Get all testimonials - Public access
TestimonialRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getAllTestimonials(req, res, next);
  }
);

// Get unique companies - Public access
TestimonialRouter.get(
  '/companies',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getUniqueCompanies(req, res, next);
  }
);

// Get testimonials by solution ID - Public access
TestimonialRouter.get(
  '/solution/:solutionId',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getTestimonialsBySolutionId(req, res, next);
  }
);

// Get testimonial count by solution ID - Public access
TestimonialRouter.get(
  '/solution/:solutionId/count',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getTestimonialCountBySolutionId(req, res, next);
  }
);

// Get testimonials by company - Public access
TestimonialRouter.get(
  '/company/:company',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getTestimonialsByCompany(req, res, next);
  }
);

// Get testimonial by ID - Public access
TestimonialRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getTestimonialById(req, res, next);
  }
);

// Get testimonial with solution by ID - Public access
TestimonialRouter.get(
  '/:id/solution',
  (req: Request, res: Response, next: NextFunction) => {
    testimonialController.getTestimonialWithSolution(req, res, next);
  }
);

// UPDATE ROUTES
// Update testimonial - Admin only
TestimonialRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    testimonialController.updateTestimonial(req, res, next);
  }
);

// Patch testimonial - Admin only
TestimonialRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    testimonialController.updateTestimonial(req, res, next);
  }
);

// DELETE ROUTES
// Delete testimonial - Admin only
TestimonialRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    testimonialController.deleteTestimonial(req, res, next);
  }
);