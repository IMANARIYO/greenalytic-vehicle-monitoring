import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import SolutionController from '../../controllers/website/SolutionController.js';

export const SolutionRouter = Router();

const solutionController = SolutionController;

// CREATE ROUTES
// Create solution - Admin only
SolutionRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.createSolution(req, res, next);
  }
);

// READ ROUTES
// Get all solutions - Public access
SolutionRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getAllSolutions(req, res, next);
  }
);

// Get all solution types - Public access
SolutionRouter.get(
  '/types',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getSolutionTypes(req, res, next);
  }
);

// Get solution types in use - Public access
SolutionRouter.get(
  '/types/in-use',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getTypesInUse(req, res, next);
  }
);

// Get solutions by type - Public access
SolutionRouter.get(
  '/type/:type',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getSolutionsByType(req, res, next);
  }
);

// Get solution count by type - Public access
SolutionRouter.get(
  '/type/:type/count',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getSolutionCountByType(req, res, next);
  }
);

// Get solution by ID - Public access
SolutionRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getSolutionById(req, res, next);
  }
);

// Get solution with testimonials by ID - Public access
SolutionRouter.get(
  '/:id/testimonials',
  (req: Request, res: Response, next: NextFunction) => {
    solutionController.getSolutionWithTestimonials(req, res, next);
  }
);

// UPDATE ROUTES
// Update solution - Admin only
SolutionRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    solutionController.updateSolution(req, res, next);
  }
);

// Patch solution - Admin only
SolutionRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    solutionController.updateSolution(req, res, next);
  }
);

// DELETE ROUTES
// Delete solution - Admin only
SolutionRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    solutionController.deleteSolution(req, res, next);
  }
);