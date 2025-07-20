import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import TeamController from '../../controllers/website/TeamController.js';

export const TeamRouter = Router();

const teamController = TeamController;

// CREATE ROUTES
// Create team member - Admin only
TeamRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    teamController.createTeamMember(req, res, next);
  }
);

// READ ROUTES
// Get all team members - Public access
TeamRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    teamController.getAllTeamMembers(req, res, next);
  }
);

// Get team members by department - Public access
TeamRouter.get(
  '/department/:department',
  (req: Request, res: Response, next: NextFunction) => {
    teamController.getTeamMembersByDepartment(req, res, next);
  }
);

// Get team member by ID - Public access
TeamRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    teamController.getTeamMemberById(req, res, next);
  }
);

// UPDATE ROUTES
// Update team member - Admin only
TeamRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    teamController.updateTeamMember(req, res, next);
  }
);

// Patch team member - Admin only
TeamRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    teamController.updateTeamMember(req, res, next);
  }
);

// DELETE ROUTES
// Delete team member - Admin only
TeamRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    teamController.deleteTeamMember(req, res, next);
  }
);