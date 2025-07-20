import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import PartnershipReasonController from '../../controllers/website/PartnershipReasonController.js';

export const PartnershipReasonRouter = Router();

const partnershipReasonController = PartnershipReasonController;

// CREATE ROUTES
// Create partnership reason - Admin only
PartnershipReasonRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    partnershipReasonController.createPartnershipReason(req, res, next);
  }
);

// READ ROUTES
// Get all partnership reasons - Public access
PartnershipReasonRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    partnershipReasonController.getAllPartnershipReasons(req, res, next);
  }
);

// Get partnership reason by ID - Public access
PartnershipReasonRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    partnershipReasonController.getPartnershipReasonById(req, res, next);
  }
);

// UPDATE ROUTES
// Update partnership reason - Admin only
PartnershipReasonRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnershipReasonController.updatePartnershipReason(req, res, next);
  }
);

// Patch partnership reason - Admin only
PartnershipReasonRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnershipReasonController.updatePartnershipReason(req, res, next);
  }
);

// DELETE ROUTES
// Delete partnership reason - Admin only
PartnershipReasonRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnershipReasonController.deletePartnershipReason(req, res, next);
    }
);