import { Router, Request, Response, NextFunction } from 'express';
import { hasRole } from '../middlewares/hasRole';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import FuelDataController from '../controllers/FuelDataController';

export const FuelDataRouter = Router();

const fuelDataController = FuelDataController;

// CREATE ROUTES
// Create fuel data
FuelDataRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    fuelDataController.createFuelData(req, res, next);
  }
);

// READ ROUTES
// Get all fuel data - No restrictions based on pattern
FuelDataRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    fuelDataController.getAllFuelData(req, res, next);
  }
);

// Get fuel statistics - Admin only
FuelDataRouter.get(
  '/statistics',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.getFuelStatistics(req, res, next);
  }
);

// Health check for fuel service
FuelDataRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Fuel service is healthy',
    timestamp: new Date().toISOString(),
    service: 'fuel-api'
  });
});

// Get fuel data by ID - Authenticated users
FuelDataRouter.get(
  '/:id',
//   isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.getFuelDataById(req, res, next);
  }
);

// Get fuel data by vehicle - No restrictions based on pattern
FuelDataRouter.get(
  '/vehicle/:vehicleId',
  (req: Request, res: Response, next: NextFunction) => {
    fuelDataController.getFuelDataByVehicle(req, res, next);
  }
);

// Get fuel data by vehicle interval - Original route
FuelDataRouter.get(
  '/vehicle/:vehicleId/interval',
  (req: Request, res: Response, next: NextFunction) => {
    fuelDataController.getFuelDataByVehicleInterval(req, res, next);
  }
);

// Get fuel data by plate number - Admin only
FuelDataRouter.get(
  '/plate/:plateNumber',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.getFuelDataByPlateNumber(req, res, next);
  }
);

// Get fuel data by consumption range - Admin only
FuelDataRouter.get(
  '/consumption/range',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.getFuelDataByConsumptionRange(req, res, next);
  }
);

// UPDATE ROUTES
// Update fuel data - Admin only
FuelDataRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.updateFuelData(req, res, next);
  }
);

// Patch fuel data - Admin only
FuelDataRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.updateFuelData(req, res, next);
  }
);

// DELETE ROUTES
// Delete fuel data - Admin only
FuelDataRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    fuelDataController.deleteFuelData(req, res, next);
  }
);

// Get fuel consumption thresholds
FuelDataRouter.get('/config/thresholds', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Fuel consumption thresholds retrieved successfully',
    data: {
      consumption: { warning: 15, critical: 20 }, // Consumption in L/100km
      level: { low: 10, critical: 5 }, // Fuel level percentage
      efficiency: { poor: 5, excellent: 12 } // Efficiency in km/L
    }
  });
});