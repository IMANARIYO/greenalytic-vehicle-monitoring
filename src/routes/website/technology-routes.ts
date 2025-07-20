import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import TechnologyController from '../../controllers/website/TechnologyController.js';

export const TechnologyRouter = Router();

const technologyController = TechnologyController;

// CREATE ROUTES
// Create technology - Admin only
TechnologyRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    technologyController.createTechnology(req, res, next);
  }
);

// READ ROUTES
// Get all technologies - Public access
TechnologyRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    technologyController.getAllTechnologies(req, res, next);
  }
);

// Get technology by ID - Public access
TechnologyRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    technologyController.getTechnologyById(req, res, next);
  }
);

// UPDATE ROUTES
// Update technology - Admin only
TechnologyRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    technologyController.updateTechnology(req, res, next);
  }
);

// Patch technology - Admin only
TechnologyRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    technologyController.updateTechnology(req, res, next);
  }
);

// DELETE ROUTES
// Delete technology - Admin only
TechnologyRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    technologyController.deleteTechnology(req, res, next);
  }
);