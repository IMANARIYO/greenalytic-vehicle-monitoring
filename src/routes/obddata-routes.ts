import { Router, Request, Response, NextFunction } from 'express';
import { hasRole } from '../middlewares/hasRole';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import OBDDataController from '../controllers/OBDDataController';

export const OBDDataRouter = Router();

const obdDataController = OBDDataController;

// CREATE ROUTES
// Create OBD data
OBDDataRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    obdDataController.createOBDData(req, res, next);
  }
);

// READ ROUTES
// Get all OBD data - No restrictions based on pattern
OBDDataRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    obdDataController.getAllOBDData(req, res, next);
  }
);

// Get OBD statistics - Admin only
OBDDataRouter.get(
  '/statistics',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.getOBDStatistics(req, res, next);
  }
);

// Health check for OBD service
OBDDataRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'OBD service is healthy',
    timestamp: new Date().toISOString(),
    service: 'obd-api'
  });
});

// Get OBD data by ID - Authenticated users
OBDDataRouter.get(
  '/:id',
//   isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.getOBDDataById(req, res, next);
  }
);

// Get OBD data by vehicle - No restrictions based on pattern
OBDDataRouter.get(
  '/vehicle/:vehicleId',
  (req: Request, res: Response, next: NextFunction) => {
    obdDataController.getOBDDataByVehicle(req, res, next);
  }
);

// Get OBD data by vehicle interval - Original route
OBDDataRouter.get(
  '/vehicle/:vehicleId/interval',
  (req: Request, res: Response, next: NextFunction) => {
    obdDataController.getOBDDataByVehicleInterval(req, res, next);
  }
);

// Get OBD data by plate number - Admin only
OBDDataRouter.get(
  '/plate/:plateNumber',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.getOBDDataByPlateNumber(req, res, next);
  }
);

// UPDATE ROUTES
// Update OBD data - Admin only
OBDDataRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.updateOBDData(req, res, next);
  }
);

// Patch OBD data - Admin only
OBDDataRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.updateOBDData(req, res, next);
  }
);

// DELETE ROUTES
// Delete OBD data - Admin only
OBDDataRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    obdDataController.deleteOBDData(req, res, next);
  }
);

// Get OBD diagnostic thresholds
OBDDataRouter.get('/config/thresholds', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'OBD diagnostic thresholds retrieved successfully',
    data: {
      rpm: { normal: 6000, critical: 7000 }, // RPM thresholds
      engineTemperature: { normal: 90, critical: 110 }, // Temperature in °C
      throttlePosition: { normal: 100, warning: 95 }, // Throttle position %
      faultCodes: { maxActive: 0, warningLimit: 3 } // Fault code limits
    }
  });
});