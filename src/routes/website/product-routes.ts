import { Router, Request, Response, NextFunction } from 'express';
// import { hasRole } from '../middlewares/hasRole';
// import { isLoggedIn } from '../middlewares/isLoggedIn';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import ProductController from '../../controllers/website/ProductController';

export const ProductRouter = Router();

const productController = ProductController;

// CREATE ROUTES
// Create product - Admin only
ProductRouter.post(
  '/',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: Request, res: Response, next: NextFunction) => {
    productController.createProduct(req, res, next);
  }
);

// READ ROUTES
// Get all products - Public access
ProductRouter.get(
  '/',
  (req: Request, res: Response, next: NextFunction) => {
    productController.getAllProducts(req, res, next);
  }
);


// Get product by ID - Public access
ProductRouter.get(
  '/:id',
  (req: Request, res: Response, next: NextFunction) => {
    productController.getProductById(req, res, next);
  }
);

// Get product with features by ID - Public access
ProductRouter.get(
  '/:id/features',
  (req: Request, res: Response, next: NextFunction) => {
    productController.getProductWithFeatures(req, res, next);
  }
);

// UPDATE ROUTES
// Update product - Admin only
ProductRouter.put(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    productController.updateProduct(req, res, next);
  }
);

// Patch product - Admin only
ProductRouter.patch(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    productController.updateProduct(req, res, next);
  }
);

// DELETE ROUTES
// Delete product - Admin only
ProductRouter.delete(
  '/:id',
//   isLoggedIn,
//   hasRole(['ADMIN']),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    productController.deleteProduct(req, res, next);
  }
);