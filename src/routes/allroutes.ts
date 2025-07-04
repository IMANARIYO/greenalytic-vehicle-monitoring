import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';
import VehiclesRouter from './vehicle-routes';
const MainRouter = Router();
MainRouter.use('/users', UserRouter)
MainRouter.use('/vehicles', VehiclesRouter)
export default MainRouter;