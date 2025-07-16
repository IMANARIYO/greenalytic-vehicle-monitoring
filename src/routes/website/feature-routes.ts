import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import FeatureController from '../../controllers/website/FeatureController';

export const FeatureRouter = Router();

const featureController = FeatureController;

// CREATE ROUTES
// Create feature - Admin only
FeatureRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    featureController.createFeature(req, res, next);
  }
);

// READ ROUTES
// Get all features - Public access
FeatureRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    featureController.getAllFeatures(req, res, next);
  }
);

// Get features by product ID - Public access
FeatureRouter.get(
  '/product/:productId',
  (req: Request, res: Response, next: NextFunction) => {
    featureController.getFeaturesByProductId(req, res, next);
  }
);


// Get feature by ID - Public access
FeatureRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    featureController.getFeatureById(req, res, next);
  }
);

// Get feature with product by ID - Public access
FeatureRouter.get(
  '/:id/product',
  (req: Request, res: Response, next: NextFunction) => {
    featureController.getFeatureWithProduct(req, res, next);
  }
);

// UPDATE ROUTES
// Update feature - Admin only
FeatureRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    featureController.updateFeature(req, res, next);
  }
);

// Patch feature - Admin only
FeatureRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    featureController.updateFeature(req, res, next);
  }
);

// DELETE ROUTES
// Delete feature - Admin only
FeatureRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    featureController.deleteFeature(req, res, next);
  }
);