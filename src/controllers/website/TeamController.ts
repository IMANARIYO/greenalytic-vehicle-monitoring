import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import TeamService from '../../services/website/TeamService.js';
import { CreateTeamDTO, UpdateTeamDTO, TeamQueryDTO, Department } from '../../types/webiste/dtos/TeamDto.js';

class TeamController {

  constructor() {
  }

  createTeamMember = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateTeamDTO = {
      name: req.body.name,
      position: req.body.position,
      department: req.body.department as Department,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      socialLinks: req.body.socialLinks,
      experienceYears: req.body.experienceYears ? parseInt(req.body.experienceYears) : undefined,
      location: req.body.location,
      profileUrl: req.body.profileUrl
    };

    const result = await TeamService.createTeamMember(dto);
    return Response.created(res, result, 'Team member created successfully');
  });

  getAllTeamMembers = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: TeamQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      department: req.query.department as Department,
      location: req.query.location as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await TeamService.getAllTeamMembers(query);
    return Response.success(res, result, 'Team members retrieved successfully');
  });

  getTeamMemberById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await TeamService.getTeamMemberById(id);
    return Response.success(res, result, 'Team member retrieved successfully');
  });

  getTeamMembersByDepartment = catchAsync(async (req: Request, res: ExpressResponse) => {
    const department = req.params.department as Department;
    const result = await TeamService.getTeamMembersByDepartment(department);
    return Response.success(res, result, 'Team members retrieved successfully');
  });

  updateTeamMember = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateTeamDTO = {
      name: req.body.name,
      position: req.body.position,
      department: req.body.department as Department,
      description: req.body.description,
      imageUrl: req.body.imageUrl,
      socialLinks: req.body.socialLinks,
      experienceYears: req.body.experienceYears ? parseInt(req.body.experienceYears) : undefined,
      location: req.body.location,
      profileUrl: req.body.profileUrl
    };

    const result = await TeamService.updateTeamMember(id, dto);
    return Response.success(res, result, 'Team member updated successfully');
  });

  deleteTeamMember = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await TeamService.deleteTeamMember(id);
    return Response.success(res, null, 'Team member deleted successfully');
  });
}

export default new TeamController();