import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';




const MainRouter = Router();
MainRouter.use('/users', UserRouter)

export default MainRouter;