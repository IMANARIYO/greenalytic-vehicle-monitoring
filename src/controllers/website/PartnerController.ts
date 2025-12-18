import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import { AppError, handlePrismaError, HttpStatusCode, NotFoundError } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import PartnerService from '../../services/website/PartnerService.js';
import { CreatePartnerDTO, UpdatePartnerDTO, PartnerQueryDTO } from '../../types/webiste/dtos/PartnerDto.js';

class PartnerController {

  constructor() {
  }

  createPartner = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreatePartnerDTO = {
      name: req.body.name,
      description: req.body.description,
      logoUrl: req.body.logoUrl,
      websiteUrl: req.body.websiteUrl,
      categoryId: parseInt(req.body.categoryId),
      keyImpact: req.body.keyImpact
    };

    const result = await PartnerService.createPartner(dto);
    return Response.created(res, result, 'Partner created successfully');
  });
  uploadLogo = catchAsync(async (req: Request, res: ExpressResponse) => {
    if (!req.file) {
      throw new AppError('No file uploaded', HttpStatusCode.BAD_REQUEST);
    }

    const logoUrl = await PartnerService.uploadLogo(req.file);
    return Response.success(res, { logoUrl }, 'Logo uploaded successfully');
  });
  getAllPartners = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: PartnerQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
      categoryName: req.query.categoryName as string,
      includeCategory: req.query.includeCategory === 'true',
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await PartnerService.getAllPartners(query);
    return Response.success(res, result, 'Partners retrieved successfully');
  });

  getPartnerById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await PartnerService.getPartnerById(id);
    return Response.success(res, result, 'Partner retrieved successfully');
  });

  getPartnerWithCategory = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await PartnerService.getPartnerWithCategory(id);
    return Response.success(res, result, 'Partner with category retrieved successfully');
  });

  getPartnersByCategory = catchAsync(async (req: Request, res: ExpressResponse) => {
    const categoryId = parseInt(req.params.categoryId);
    const result = await PartnerService.getPartnersByCategory(categoryId);
    return Response.success(res, result, 'Partners retrieved successfully');
  });

  updatePartner = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdatePartnerDTO = {
      name: req.body.name,
      description: req.body.description,
      logoUrl: req.body.logoUrl,
      websiteUrl: req.body.websiteUrl,
      categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : undefined,
      keyImpact: req.body.keyImpact
    };

    const result = await PartnerService.updatePartner(id, dto);
    return Response.success(res, result, 'Partner updated successfully');
  });

  deletePartner = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await PartnerService.deletePartner(id);
    return Response.success(res, null, 'Partner deleted successfully');
  });
}

export default new PartnerController();