import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import PartnershipReasonService from '../../services/website/ParnershipReasonService.js';
import { CreatePartnershipReasonDTO, UpdatePartnershipReasonDTO, PartnershipReasonQueryDTO } from '../../types/webiste/dtos/PartnershipReasonDto.js';

class PartnershipReasonController {

  constructor() {
  }

  createPartnershipReason = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreatePartnershipReasonDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon
    };

    const result = await PartnershipReasonService.createPartnershipReason(dto);
    return Response.created(res, result, 'Partnership reason created successfully');
  });

  getAllPartnershipReasons = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: PartnershipReasonQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await PartnershipReasonService.getAllPartnershipReasons(query);
    return Response.success(res, result, 'Partnership reasons retrieved successfully');
  });

  getPartnershipReasonById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await PartnershipReasonService.getPartnershipReasonById(id);
    return Response.success(res, result, 'Partnership reason retrieved successfully');
  });

  updatePartnershipReason = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdatePartnershipReasonDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon
    };

    const result = await PartnershipReasonService.updatePartnershipReason(id, dto);
    return Response.success(res, result, 'Partnership reason updated successfully');
  });

  deletePartnershipReason = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await PartnershipReasonService.deletePartnershipReason(id);
    return Response.success(res, null, 'Partnership reason deleted successfully');
  });
}

export default new PartnershipReasonController();