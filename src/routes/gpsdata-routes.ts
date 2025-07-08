import { Router, Request, Response, NextFunction } from 'express';
import { hasRole } from '../middlewares/hasRole';
import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../utils/jwtFunctions';
import GpsDataController from '../controllers/GpsDataController';

export const GpsDataRouter = Router();

const gpsDataController = new GpsDataController();

// CREATE ROUTES
// Create GPS data
GpsDataRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    gpsDataController.createGpsData(req, res, next);
  }
);

// READ ROUTES
// Get all GPS data - No restrictions based on pattern
GpsDataRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    gpsDataController.getAllGpsData(req, res, next);
  }
);

// Get GPS statistics - Admin only
GpsDataRouter.get(
  '/statistics',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.getGpsStatistics(req, res, next);
  }
);

// Health check for GPS service
GpsDataRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'GPS service is healthy',
    timestamp: new Date().toISOString(),
    service: 'gps-api'
  });
});

// Get GPS data by ID - Authenticated users
GpsDataRouter.get(
  '/:id',
//   isLoggedIn,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataById(req, res, next);
  }
);

// Get GPS data by vehicle - No restrictions based on pattern
GpsDataRouter.get(
  '/vehicle/:vehicleId',
  (req: Request, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataByVehicle(req, res, next);
  }
);

// Get GPS data by vehicle interval - Original route
GpsDataRouter.get(
  '/vehicle/:vehicleId/interval',
  (req: Request, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataByVehicleInterval(req, res, next);
  }
);

// Get GPS data by plate number - Admin only
GpsDataRouter.get(
  '/plate/:plateNumber',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataByPlateNumber(req, res, next);
  }
);

// Get GPS data by location radius - Admin only
GpsDataRouter.get(
  '/location/radius',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataByLocationRadius(req, res, next);
  }
);

// Get GPS data by speed range - Admin only
GpsDataRouter.get(
  '/speed/range',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.getGpsDataBySpeedRange(req, res, next);
  }
);

// UPDATE ROUTES
// Update GPS data - Admin only
GpsDataRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.updateGpsData(req, res, next);
  }
);

// Patch GPS data - Admin only
GpsDataRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.updateGpsData(req, res, next);
  }
);

// DELETE ROUTES
// Delete GPS data - Admin only
GpsDataRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.deleteGpsData(req, res, next);
  }
);

// Soft delete GPS data - Admin only
GpsDataRouter.patch(
  '/:id/deactivate',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    req.body = { deletedAt: new Date() };
    next();
  },
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    gpsDataController.updateGpsData(req, res, next);
  }
);

// Get GPS speed thresholds
GpsDataRouter.get('/config/thresholds', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'GPS speed thresholds retrieved successfully',
    data: {
      speed: { warning: 100, critical: 120 }, // Speed in km/h
      accuracy: { minimum: 10 }, // Minimum accuracy in meters
      tracking: { interval: 30 } // Tracking interval in seconds
    }
  });
});