import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes';
import { EmissionRouter } from './emissiondata-routes';
import { FuelDataRouter } from './fueldata-routes';
import { GpsDataRouter } from './gpsdata-routes';
import { OBDDataRouter } from './obddata-routes'; // Uncomment if OBDDataRouter is defined
import VehiclesRouter from './vehicle-routes';
import TrackingdevicesRouter from './trackingdevice-routes';
import { ValueRouter } from './website/value-routes';
import { TechnologyRouter } from './website/technology-routes'; // Import the TechnologyRouter
import { PartnershipReasonRouter } from './website/partnership-reason-routes'; // Import the PartnershipReasonRouter
import { TeamRouter } from './website/team-routes'; // Import the TeamRouter
import { AdvisoryBoardRouter } from './website/advisory-board-routes';
import { ContactMessageRouter } from './website/contact-message-routes'; // Import the ContactMessageRouter
import { PartnerCategoryRouter } from './website/partner-category-routes'; // Import the PartnerCategoryRouter
import { PartnerRouter } from './website/partner-routes'; // Import the PartnerRouter
import { FeatureRouter } from './website/feature-routes'; // Import the FeatureRouter
import { ProductRouter } from './website/product-routes'; // Import the ProductRouter
import { SolutionRouter } from './website/solution-routes'; // Import the SolutionRouter
import { TestimonialRouter } from './website/testimonial-routes'; // Import the TestimonialRouter

const MainRouter = Router();
MainRouter.use('/users', UserRouter)
MainRouter.use('/vehicles', VehiclesRouter)
MainRouter.use('/emissions', EmissionRouter);
MainRouter.use('/fuel', FuelDataRouter);
MainRouter.use('/gps', GpsDataRouter);
MainRouter.use('/obd', OBDDataRouter);

//website routes
MainRouter.use('/website/values', ValueRouter);
MainRouter.use('/website/technologies', TechnologyRouter);
MainRouter.use('/website/partnership-reasons', PartnershipReasonRouter);
MainRouter.use('/website/team', TeamRouter);
MainRouter.use('/website/advisory-board', AdvisoryBoardRouter);
MainRouter.use('/website/contact-messages', ContactMessageRouter);
MainRouter.use('/website/partner-categories', PartnerCategoryRouter);
MainRouter.use('/website/partners', PartnerRouter);
MainRouter.use('/website/features', FeatureRouter);
MainRouter.use('/website/products', ProductRouter);
MainRouter.use('/website/solutions', SolutionRouter);
MainRouter.use('/website/testimonials', TestimonialRouter);

MainRouter.get('/test', (req, res) => {
  res.json({ message: 'MainRouter is working' });
});
MainRouter.use('/tracking-devices', TrackingdevicesRouter)
export default MainRouter;