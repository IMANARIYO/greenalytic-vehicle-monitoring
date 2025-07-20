import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import FeatureService from '../../services/website/FeatureService.js';
import { CreateFeatureDTO, UpdateFeatureDTO, FeatureQueryDTO } from '../../types/webiste/dtos/FeatureDto.js';

class FeatureController {

  constructor() {
  }

  createFeature = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateFeatureDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon,
      productId: parseInt(req.body.productId)
    };

    const result = await FeatureService.createFeature(dto);
    return Response.created(res, result, 'Feature created successfully');
  });

  getAllFeatures = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: FeatureQueryDTO & { includeProduct?: boolean } = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      productId: req.query.productId ? parseInt(req.query.productId as string) : undefined,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      includeProduct: req.query.includeProduct === 'true'
    };

    const result = await FeatureService.getAllFeatures(query);
    return Response.success(res, result, 'Features retrieved successfully');
  });

  getFeatureById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await FeatureService.getFeatureById(id);
    return Response.success(res, result, 'Feature retrieved successfully');
  });

  getFeatureWithProduct = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await FeatureService.getFeatureWithProduct(id);
    return Response.success(res, result, 'Feature with product retrieved successfully');
  });

  updateFeature = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateFeatureDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon,
      productId: req.body.productId ? parseInt(req.body.productId) : undefined
    };

    const result = await FeatureService.updateFeature(id, dto);
    return Response.success(res, result, 'Feature updated successfully');
  });

  deleteFeature = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await FeatureService.deleteFeature(id);
    return Response.success(res, null, 'Feature deleted successfully');
  });

  getFeaturesByProductId = catchAsync(async (req: Request, res: ExpressResponse) => {
    const productId = parseInt(req.params.productId);
    const result = await FeatureService.getFeaturesByProductId(productId);
    return Response.success(res, result, 'Features by product retrieved successfully');
  });

}

export default new FeatureController();