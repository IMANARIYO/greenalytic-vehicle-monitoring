import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import { catchAsync } from '../../middlewares/errorHandler';
import Response from '../../utils/response';
import SolutionService from '../../services/website/SolutionService';
import { CreateSolutionDTO, UpdateSolutionDTO, SolutionQueryDTO} from '../../types/webiste/dtos/SolutionDto';
import { SolutionType } from '@prisma/client';

class SolutionController {

  constructor() {
  }

  createSolution = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateSolutionDTO = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      content: req.body.content,
      icon: req.body.icon,
      type: req.body.type as SolutionType
    };

    const result = await SolutionService.createSolution(dto);
    return Response.created(res, result, 'Solution created successfully');
  });

  getAllSolutions = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: SolutionQueryDTO & { includeTestimonials?: boolean } = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      type: req.query.type as SolutionType,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      includeTestimonials: req.query.includeTestimonials === 'true'
    };

    const result = await SolutionService.getAllSolutions(query);
    return Response.success(res, result, 'Solutions retrieved successfully');
  });

  getSolutionById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await SolutionService.getSolutionById(id);
    return Response.success(res, result, 'Solution retrieved successfully');
  });

  getSolutionWithTestimonials = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await SolutionService.getSolutionWithTestimonials(id);
    return Response.success(res, result, 'Solution with testimonials retrieved successfully');
  });

  updateSolution = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateSolutionDTO = {
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      content: req.body.content,
      icon: req.body.icon,
      type: req.body.type as SolutionType
    };

    const result = await SolutionService.updateSolution(id, dto);
    return Response.success(res, result, 'Solution updated successfully');
  });

  deleteSolution = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await SolutionService.deleteSolution(id);
    return Response.success(res, null, 'Solution deleted successfully');
  });

  getSolutionsByType = catchAsync(async (req: Request, res: ExpressResponse) => {
    const type = req.params.type as SolutionType;
    const result = await SolutionService.getSolutionsByType(type);
    return Response.success(res, result, 'Solutions by type retrieved successfully');
  });

  getSolutionTypes = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await SolutionService.getSolutionTypes();
    return Response.success(res, result, 'Solution types retrieved successfully');
  });

  getTypesInUse = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await SolutionService.getTypesInUse();
    return Response.success(res, result, 'Solution types in use retrieved successfully');
  });

  getSolutionCountByType = catchAsync(async (req: Request, res: ExpressResponse) => {
    const type = req.params.type as SolutionType;
    const result = await SolutionService.getSolutionCountByType(type);
    return Response.success(res, { count: result }, 'Solution count by type retrieved successfully');
  });
}

export default new SolutionController();