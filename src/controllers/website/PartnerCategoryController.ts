import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import PartnerCategoryService from '../../services/website/PartnerCategoryService.js';
import { CreatePartnerCategoryDTO, UpdatePartnerCategoryDTO, PartnerCategoryQueryDTO } from '../../types/webiste/dtos/PartnerCategoryDto.js';

class PartnerCategoryController {

  constructor() {
  }

  createPartnerCategory = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreatePartnerCategoryDTO = {
      name: req.body.name,
      icon: req.body.icon
    };

    const result = await PartnerCategoryService.createPartnerCategory(dto);
    return Response.created(res, result, 'Partner category created successfully');
  });

  getAllPartnerCategories = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: PartnerCategoryQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      includePartnersCount: req.query.includePartnersCount === 'true',
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await PartnerCategoryService.getAllPartnerCategories(query);
    return Response.success(res, result, 'Partner categories retrieved successfully');
  });

  getPartnerCategoryById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await PartnerCategoryService.getPartnerCategoryById(id);
    return Response.success(res, result, 'Partner category retrieved successfully');
  });

  getPartnerCategoryWithPartners = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await PartnerCategoryService.getPartnerCategoryWithPartners(id);
    return Response.success(res, result, 'Partner category with partners retrieved successfully');
  });

  updatePartnerCategory = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdatePartnerCategoryDTO = {
      name: req.body.name,
      icon: req.body.icon
    };

    const result = await PartnerCategoryService.updatePartnerCategory(id, dto);
    return Response.success(res, result, 'Partner category updated successfully');
  });

  deletePartnerCategory = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await PartnerCategoryService.deletePartnerCategory(id);
    return Response.success(res, null, 'Partner category deleted successfully');
  });
}

export default new PartnerCategoryController();