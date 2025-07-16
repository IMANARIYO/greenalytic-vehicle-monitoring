import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions';
import { catchAsync } from '../../middlewares/errorHandler';
import Response from '../../utils/response';
import AdvisoryBoardService from '../../services/website/AdvisoryBoardService';
import { CreateAdvisoryBoardDTO, UpdateAdvisoryBoardDTO, AdvisoryBoardQueryDTO } from '../../types/webiste/dtos/AdvisoryBoardDto';

class AdvisoryBoardController {

  constructor() {
  }

  createAdvisoryBoardMember = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateAdvisoryBoardDTO = {
      name: req.body.name,
      position: req.body.position,
      company: req.body.company,
      highlight: req.body.highlight,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      socialLinks: req.body.socialLinks,
      fullBioLink: req.body.fullBioLink
    };

    const result = await AdvisoryBoardService.createAdvisoryBoardMember(dto);
    return Response.created(res, result, 'Advisory board member created successfully');
  });

  getAllAdvisoryBoardMembers = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: AdvisoryBoardQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      company: req.query.company as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await AdvisoryBoardService.getAllAdvisoryBoardMembers(query);
    return Response.success(res, result, 'Advisory board members retrieved successfully');
  });

  getAdvisoryBoardMemberById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await AdvisoryBoardService.getAdvisoryBoardMemberById(id);
    return Response.success(res, result, 'Advisory board member retrieved successfully');
  });

  getAdvisoryBoardMembersByCompany = catchAsync(async (req: Request, res: ExpressResponse) => {
    const company = req.params.company;
    const result = await AdvisoryBoardService.getAdvisoryBoardMembersByCompany(company);
    return Response.success(res, result, 'Advisory board members retrieved successfully');
  });

  updateAdvisoryBoardMember = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateAdvisoryBoardDTO = {
      name: req.body.name,
      position: req.body.position,
      company: req.body.company,
      highlight: req.body.highlight,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      socialLinks: req.body.socialLinks,
      fullBioLink: req.body.fullBioLink
    };

    const result = await AdvisoryBoardService.updateAdvisoryBoardMember(id, dto);
    return Response.success(res, result, 'Advisory board member updated successfully');
  });

  deleteAdvisoryBoardMember = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await AdvisoryBoardService.deleteAdvisoryBoardMember(id);
    return Response.success(res, null, 'Advisory board member deleted successfully');
  });
}

export default new AdvisoryBoardController();