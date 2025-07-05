import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';
import VehiclesRouter from './vehicle-routes';
import authRoutes from './authRoutes';
import DeviceRouter from './DeviceRoutes';
const MainRouter = Router();
MainRouter.use("/auth",authRoutes);
MainRouter.use('/users', UserRouter)
MainRouter.use('/vehicles', VehiclesRouter)
MainRouter.use("/devices", DeviceRouter);
export default MainRouter;