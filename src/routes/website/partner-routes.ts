import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import PartnerController from '../../controllers/website/PartnerController';

export const PartnerRouter = Router();

const partnerController = PartnerController;

// CREATE ROUTES
// Create partner - Admin only
PartnerRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.createPartner(req, res, next);
  }
);

// READ ROUTES
// Get all partners - Public access
PartnerRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getAllPartners(req, res, next);
  }
);

// Get partners by category - Public access
PartnerRouter.get(
  '/category/:categoryId',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnersByCategory(req, res, next);
  }
);

// Get partner with category details - Public access
PartnerRouter.get(
  '/:id/category',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnerWithCategory(req, res, next);
  }
);

// Get partner by ID - Public access
PartnerRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnerById(req, res, next);
  }
);

// UPDATE ROUTES
// Update partner - Admin only
PartnerRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.updatePartner(req, res, next);
  }
);

// Patch partner - Admin only
PartnerRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.updatePartner(req, res, next);
  }
);

// DELETE ROUTES
// Delete partner - Admin only
PartnerRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.deletePartner(req, res, next);
  }
);