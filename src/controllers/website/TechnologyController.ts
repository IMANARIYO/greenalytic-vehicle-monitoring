import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import { catchAsync } from '../../middlewares/errorHandler';
import Response from '../../utils/response';
import TechnologyService from '../../services/website/TechnologyService';
import { CreateTechnologyDTO, UpdateTechnologyDTO, TechnologyQueryDTO } from '../../types/webiste/dtos/TechnologyDto';

class TechnologyController {

  constructor() {
  }

  createTechnology = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateTechnologyDTO = {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon
    };

    const result = await TechnologyService.createTechnology(dto);
    return Response.created(res, result, 'Technology created successfully');
  });

  getAllTechnologies = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: TechnologyQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await TechnologyService.getAllTechnologies(query);
    return Response.success(res, result, 'Technologies retrieved successfully');
  });

  getTechnologyById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await TechnologyService.getTechnologyById(id);
    return Response.success(res, result, 'Technology retrieved successfully');
  });

  updateTechnology = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateTechnologyDTO = {
      name: req.body.name,
      description: req.body.description,
      icon: req.body.icon
    };

    const result = await TechnologyService.updateTechnology(id, dto);
    return Response.success(res, result, 'Technology updated successfully');
  });

  deleteTechnology = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await TechnologyService.deleteTechnology(id);
    return Response.success(res, null, 'Technology deleted successfully');
  });
}

export default new TechnologyController();