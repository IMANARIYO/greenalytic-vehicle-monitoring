import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import ValueService from '../../services/website/ValueService.js';
import { CreateValueDTO, UpdateValueDTO, ValueQueryDTO } from '../../types/webiste/dtos/ValueDto.js';

class ValueController {

  constructor() {
  }

  createValue = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateValueDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon,
      iconBackgroundColor: req.body.iconBackgroundColor
    };

    const result = await ValueService.createValue(dto);
    return Response.created(res, result, 'Value created successfully');
  });

  getAllValues = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: ValueQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await ValueService.getAllValues(query);
    return Response.success(res, result, 'Values retrieved successfully');
  });

  getValueById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await ValueService.getValueById(id);
    return Response.success(res, result, 'Value retrieved successfully');
  });

  updateValue = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateValueDTO = {
      title: req.body.title,
      description: req.body.description,
      icon: req.body.icon
    };

    const result = await ValueService.updateValue(id, dto);
    return Response.success(res, result, 'Value updated successfully');
  });

  deleteValue = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await ValueService.deleteValue(id);
    return Response.success(res, null, 'Value deleted successfully');
  });
}

export default new ValueController();