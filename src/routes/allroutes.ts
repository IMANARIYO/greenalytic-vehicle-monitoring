import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';
import { EmissionRouter } from './emissiondata-routes';
import VehiclesRouter from './vehicle-routes';
import TrackingdevicesRouter from './trackingdevice-routes';
const MainRouter = Router();
MainRouter.use('/users', UserRouter)
MainRouter.use('/vehicles', VehiclesRouter)
MainRouter.use('/emissions', EmissionRouter);
MainRouter.get('/test', (req, res) => {
  res.json({ message: 'MainRouter is working' });
});
MainRouter.use('/tracking-devices', TrackingdevicesRouter)
export default MainRouter;