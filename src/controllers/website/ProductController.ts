import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import ProductService from '../../services/website/ProductService.js';
import { CreateProductDTO, UpdateProductDTO, ProductQueryDTO } from '../../types/webiste/dtos/ProductDto.js';

class ProductController {

  constructor() {
  }

  createProduct = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateProductDTO = {
      name: req.body.name,
      description: req.body.description,
      content: req.body.content,
      icon: req.body.icon,
      iconBackgroundColor: req.body.iconBackgroundColor,
    };

    const result = await ProductService.createProduct(dto);
    return Response.created(res, result, 'Product created successfully');
  });

  getAllProducts = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: ProductQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await ProductService.getAllProducts(query);
    return Response.success(res, result, 'Products retrieved successfully');
  });

  getProductById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await ProductService.getProductById(id);
    return Response.success(res, result, 'Product retrieved successfully');
  });

  getProductWithFeatures = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await ProductService.getProductWithFeatures(id);
    return Response.success(res, result, 'Product with features retrieved successfully');
  });

  updateProduct = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateProductDTO = {
      name: req.body.name,
      description: req.body.description,
      content: req.body.content,
      icon: req.body.icon,
      iconBackgroundColor: req.body.iconBackgroundColor,
    };

    const result = await ProductService.updateProduct(id, dto);
    return Response.success(res, result, 'Product updated successfully');
  });

  deleteProduct = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await ProductService.deleteProduct(id);
    return Response.success(res, null, 'Product deleted successfully');
  });
}

export default new ProductController();