import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import EmissionDataController from '../controllers/EmissionDataController';
// import VehicleDataController from '../controllers/VehicleDataController';

export const EmissionRouter = Router();

const emissionDataController = new EmissionDataController();
// const vehicleDataController = new VehicleDataController();

// Apply pagination middleware to routes that need it
// const paginatedRoutes = [
//   '/',
//   '/vehicle/:vehicleId',
//   '/vehicle/:vehicleId/interval',
//   '/plate/:plateNumber'
// ];

// EmissionRouter.use(paginatedRoutes, paginationMiddleware);

// CREATE ROUTES
// Create emission data
EmissionRouter.post(
  '/',
  (req: Request, res: Response) => {
    emissionDataController.createEmissionData(req, res);
  }
);

// READ ROUTES
// Get all emission data - No restrictions based on original
EmissionRouter.get(
  '/',
  (req: Request, res: Response) => {
    emissionDataController.getAllEmissionData(req, res);
  }
);

// Get emission statistics - Admin only
EmissionRouter.get(
  '/statistics',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.getEmissionStatistics(req, res);
  }
);

// Health check for emission service
EmissionRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Emission service is healthy',
    timestamp: new Date().toISOString(),
    service: 'emission-api'
  });
});

// Get emission data by ID - Authenticated users
EmissionRouter.get(
  '/:id',
//   isLoggedIn,
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.getEmissionDataById(req, res);
  }
);

// Get emission data by vehicle - No restrictions based on original
EmissionRouter.get(
  '/vehicle/:vehicleId',
  (req: Request, res: Response) => {
    emissionDataController.getEmissionDataByVehicle(req, res);
  }
);

// Get emission data by vehicle with time interval - Enhanced route using vehicleDataController
// EmissionRouter.get(
//   '/vehicle/:vehicleId/timerange',
//   (req: Request, res: Response) => {
//     vehicleDataController.getEmissionsDataByTimeRange(req, res);
//   }
// );

// Get emission data by vehicle interval - Original route
EmissionRouter.get(
  '/vehicle/:vehicleId/interval',
  (req: Request, res: Response) => {
    emissionDataController.getEmissionDataByVehicleInterval(req, res);
  }
);

// Get emission data by plate number - Admin only
EmissionRouter.get(
  '/plate/:plateNumber',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.getEmissionDataByPlateNumber(req, res);
  }
);

// UPDATE ROUTES
// Update emission data - Admin only
EmissionRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.updateEmissionData(req, res);
  }
);

// Patch emission data - Admin only
EmissionRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.updateEmissionData(req, res);
  }
);

// DELETE ROUTES
// Delete emission data - Admin only
EmissionRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.deleteEmissionData(req, res);
  }
);

// Soft delete emission data - Admin only
EmissionRouter.patch(
  '/:id/deactivate',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.body = { deletedAt: new Date() };
    next();
  },
  (req: AuthenticatedRequest, res: Response) => {
    emissionDataController.updateEmissionData(req, res);
  }
);

// ENHANCED ROUTES using vehicleDataController - temporarily disabled
// EmissionRouter.get(
//   '/analytics/dashboard',
//   isLoggedIn,
//   hasRole(['ADMIN']),
//   (req: AuthenticatedRequest, res: Response) => {
//     res.status(501).json({ message: 'Route temporarily disabled' });
//   }
// );

// Get emission thresholds
EmissionRouter.get('/config/thresholds', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Emission thresholds retrieved successfully',
    data: {
      co2: { warning: 0.5, critical: 1.0 },
      co: { warning: 0.3, critical: 0.5 },
      hc: { warning: 200, critical: 400 },
      nox: { warning: 100, critical: 200 },
      pm25: { warning: 25, critical: 50 }
    }
  });
});