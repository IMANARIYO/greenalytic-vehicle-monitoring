import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole.js';
// import { isLoggedIn } from '../middlewares/isLoggedIn.js';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import PartnerController from '../../controllers/website/PartnerController.js';

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const PartnerRouter = Router();

const partnerController = PartnerController;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/partners/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});


PartnerRouter.post(
  '/upload-logo',
  upload.single('logo'),
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.uploadLogo(req, res, next);
  }
);

// CREATE ROUTES
// Create partner - Admin only
PartnerRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.createPartner(req, res, next);
  }
);

// READ ROUTES
// Get all partners - Public access
PartnerRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getAllPartners(req, res, next);
  }
);

// Get partners by category - Public access
PartnerRouter.get(
  '/category/:categoryId',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnersByCategory(req, res, next);
  }
);

// Get partner with category details - Public access
PartnerRouter.get(
  '/:id/category',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnerWithCategory(req, res, next);
  }
);

// Get partner by ID - Public access
PartnerRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    partnerController.getPartnerById(req, res, next);
  }
);

// UPDATE ROUTES
// Update partner - Admin only
PartnerRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.updatePartner(req, res, next);
  }
);

// Patch partner - Admin only
PartnerRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.updatePartner(req, res, next);
  }
);

// DELETE ROUTES
// Delete partner - Admin only
PartnerRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    partnerController.deletePartner(req, res, next);
  }
);