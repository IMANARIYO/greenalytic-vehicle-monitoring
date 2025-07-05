import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';
import VehiclesRouter from './vehicle-routes';
import TrackingdevicesRouter from './trackingdevice-routes';
const MainRouter = Router();
MainRouter.use('/users', UserRouter)
MainRouter.use('/vehicles', VehiclesRouter)
MainRouter.use('/trackingDevices', TrackingdevicesRouter)
export default MainRouter;