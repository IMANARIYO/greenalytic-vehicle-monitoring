import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import AdvisoryBoardController from '../../controllers/website/AdvisoryBoardController.js';

export const AdvisoryBoardRouter = Router();

const advisoryBoardController = AdvisoryBoardController;

// CREATE ROUTES
// Create advisory board member - Admin only
AdvisoryBoardRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    advisoryBoardController.createAdvisoryBoardMember(req, res, next);
  }
);

// READ ROUTES
// Get all advisory board members - Public access
AdvisoryBoardRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    advisoryBoardController.getAllAdvisoryBoardMembers(req, res, next);
  }
);

// Get advisory board members by company - Public access
AdvisoryBoardRouter.get(
  '/company/:company',
  (req: Request, res: Response, next: NextFunction) => {
    advisoryBoardController.getAdvisoryBoardMembersByCompany(req, res, next);
  }
);

// Get advisory board member by ID - Public access
AdvisoryBoardRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    advisoryBoardController.getAdvisoryBoardMemberById(req, res, next);
  }
);

// UPDATE ROUTES
// Update advisory board member - Admin only
AdvisoryBoardRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    advisoryBoardController.updateAdvisoryBoardMember(req, res, next);
  }
);

// Patch advisory board member - Admin only
AdvisoryBoardRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    advisoryBoardController.updateAdvisoryBoardMember(req, res, next);
  }
);

// DELETE ROUTES
// Delete advisory board member - Admin only
AdvisoryBoardRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    advisoryBoardController.deleteAdvisoryBoardMember(req, res, next);
  }
);