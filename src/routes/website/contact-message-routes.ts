import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import ContactMessageController from '../../controllers/website/ContactMessageController.js';

export const ContactMessageRouter = Router();

const contactMessageController = ContactMessageController;

// CREATE ROUTES
// Create contact message - Public access
ContactMessageRouter.post(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    contactMessageController.createContactMessage(req, res, next);
  }
);

// READ ROUTES
// Get all contact messages - Admin only
ContactMessageRouter.get(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getAllContactMessages(req, res, next);
  }
);

// Get recent contact messages - Admin only
ContactMessageRouter.get(
  '/recent',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getRecentContactMessages(req, res, next);
  }
);

// Get contact message count - Admin only
ContactMessageRouter.get(
  '/count',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getContactMessageCount(req, res, next);
  }
);

// Get contact messages by email - Admin only
ContactMessageRouter.get(
  '/email/:email',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getContactMessagesByEmail(req, res, next);
  }
);

// Get contact message count by email - Admin only
ContactMessageRouter.get(
  '/email/:email/count',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getContactMessageCountByEmail(req, res, next);
  }
);

// Get contact message by ID - Admin only
ContactMessageRouter.get(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.getContactMessageById(req, res, next);
  }
);

// UPDATE ROUTES
// Update contact message - Admin only
ContactMessageRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.updateContactMessage(req, res, next);
  }
);

// Patch contact message - Admin only
ContactMessageRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.updateContactMessage(req, res, next);
  }
);

// DELETE ROUTES
// Delete contact message - Admin only
ContactMessageRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    contactMessageController.deleteContactMessage(req, res, next);
  }
);