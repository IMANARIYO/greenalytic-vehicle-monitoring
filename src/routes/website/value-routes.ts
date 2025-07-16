import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import ValueController from '../../controllers/website/ValueController';

export const ValueRouter = Router();

const valueController = ValueController;

// CREATE ROUTES
// Create value - Admin only
ValueRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    valueController.createValue(req, res, next);
  }
);

// READ ROUTES
// Get all values - Public access
ValueRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    valueController.getAllValues(req, res, next);
  }
);

// Get value by ID - Public access
ValueRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    valueController.getValueById(req, res, next);
  }
);

// UPDATE ROUTES
// Update value - Admin only
ValueRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    valueController.updateValue(req, res, next);
  }
);

// Patch value - Admin only
ValueRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    valueController.updateValue(req, res, next);
  }
);

// DELETE ROUTES
// Delete value - Admin only
ValueRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    valueController.deleteValue(req, res, next);
  }
);