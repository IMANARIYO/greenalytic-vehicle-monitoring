import { Router, Request, Response } from 'express';
import { UserRouter } from './userRoutes.js';
import { EmissionRouter } from './emissiondata-routes.js';
import { FuelDataRouter } from './fueldata-routes.js';
import { GpsDataRouter } from './gpsdata-routes.js';
import { OBDDataRouter } from './obddata-routes.js'; // Uncomment if OBDDataRouter is defined
import VehiclesRouter from './vehicle-routes.js';
import TrackingdevicesRouter from './trackingdevice-routes.js';

import { ValueRouter } from './website/value-routes.js';
import { TechnologyRouter } from './website/technology-routes.js'; // Import the TechnologyRouter
import { PartnershipReasonRouter } from './website/partnership-reason-routes.js'; // Import the PartnershipReasonRouter
import { TeamRouter } from './website/team-routes.js'; // Import the TeamRouter
import { AdvisoryBoardRouter } from './website/advisory-board-routes.js';
import { ContactMessageRouter } from './website/contact-message-routes.js'; // Import the ContactMessageRouter
import { PartnerCategoryRouter } from './website/partner-category-routes.js'; // Import the PartnerCategoryRouter
import { PartnerRouter } from './website/partner-routes.js'; // Import the PartnerRouter
import { FeatureRouter } from './website/feature-routes.js'; // Import the FeatureRouter
import { ProductRouter } from './website/product-routes.js'; // Import the ProductRouter
import { SolutionRouter } from './website/solution-routes.js'; // Import the SolutionRouter
import { TestimonialRouter } from './website/testimonial-routes.js'; // Import the TestimonialRouter
import { BlogPostRouter } from './website/blog-post-routes.js';

import authRoutes from './authRoutes.js';

const MainRouter = Router();
MainRouter.use("/auth", authRoutes);
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
MainRouter.use('/website/blogs', BlogPostRouter);

MainRouter.get('/test', (req, res) => {
  res.json({ message: 'MainRouter is working' });
});
MainRouter.use('/tracking-devices', TrackingdevicesRouter)
export default MainRouter;