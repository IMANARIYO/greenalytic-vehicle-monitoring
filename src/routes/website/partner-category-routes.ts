import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import PartnerCategoryController from '../../controllers/website/PartnerCategoryController';

export const PartnerCategoryRouter = Router();

const partnerCategoryController = PartnerCategoryController;

// CREATE ROUTES
// Create partner category - Admin only
PartnerCategoryRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    partnerCategoryController.createPartnerCategory(req, res, next);
  }
);

// READ ROUTES
// Get all partner categories - Public access
PartnerCategoryRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    partnerCategoryController.getAllPartnerCategories(req, res, next);
  }
);

// Get partner category with partners - Public access
PartnerCategoryRouter.get(
  '/:id/partners',
  (req: Request, res: Response, next: NextFunction) => {
    partnerCategoryController.getPartnerCategoryWithPartners(req, res, next);
  }
);

// Get partner category by ID - Public access
PartnerCategoryRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    partnerCategoryController.getPartnerCategoryById(req, res, next);
  }
);

// UPDATE ROUTES
// Update partner category - Admin only
PartnerCategoryRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerCategoryController.updatePartnerCategory(req, res, next);
  }
);

// Patch partner category - Admin only
PartnerCategoryRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerCategoryController.updatePartnerCategory(req, res, next);
  }
);

// DELETE ROUTES
// Delete partner category - Admin only
PartnerCategoryRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerCategoryController.deletePartnerCategory(req, res, next);
  }
);