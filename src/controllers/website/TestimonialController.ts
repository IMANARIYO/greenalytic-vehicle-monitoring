import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import TestimonialService from '../../services/website/TestimonialService.js';
import { CreateTestimonialDTO, UpdateTestimonialDTO, TestimonialQueryDTO } from '../../types/webiste/dtos/TestimonialDto.js';

class TestimonialController {

  constructor() {
  }

  createTestimonial = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateTestimonialDTO = {
      name: req.body.name,
      position: req.body.position,
      company: req.body.company,
      content: req.body.content,
      imageUrl: req.body.imageUrl,
      solutionId: parseInt(req.body.solutionId)
    };

    const result = await TestimonialService.createTestimonial(dto);
    return Response.created(res, result, 'Testimonial created successfully');
  });

  getAllTestimonials = catchAsync(async (req: Request, res: ExpressResponse) => {
    const query: TestimonialQueryDTO & { includeSolution?: boolean } = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      solutionId: req.query.solutionId ? parseInt(req.query.solutionId as string) : undefined,
      company: req.query.company as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      includeSolution: req.query.includeSolution === 'true'
    };

    const result = await TestimonialService.getAllTestimonials(query);
    return Response.success(res, result, 'Testimonials retrieved successfully');
  });

  getTestimonialById = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await TestimonialService.getTestimonialById(id);
    return Response.success(res, result, 'Testimonial retrieved successfully');
  });

  getTestimonialWithSolution = catchAsync(async (req: Request, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await TestimonialService.getTestimonialWithSolution(id);
    return Response.success(res, result, 'Testimonial with solution retrieved successfully');
  });

  updateTestimonial = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateTestimonialDTO = {
      name: req.body.name,
      position: req.body.position,
      company: req.body.company,
      content: req.body.content,
      imageUrl: req.body.imageUrl,
      solutionId: req.body.solutionId ? parseInt(req.body.solutionId) : undefined
    };

    const result = await TestimonialService.updateTestimonial(id, dto);
    return Response.success(res, result, 'Testimonial updated successfully');
  });

  deleteTestimonial = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await TestimonialService.deleteTestimonial(id);
    return Response.success(res, null, 'Testimonial deleted successfully');
  });

  getTestimonialsBySolutionId = catchAsync(async (req: Request, res: ExpressResponse) => {
    const solutionId = parseInt(req.params.solutionId);
    const result = await TestimonialService.getTestimonialsBySolutionId(solutionId);
    return Response.success(res, result, 'Testimonials by solution retrieved successfully');
  });

  getTestimonialsByCompany = catchAsync(async (req: Request, res: ExpressResponse) => {
    const company = req.params.company;
    const result = await TestimonialService.getTestimonialsByCompany(company);
    return Response.success(res, result, 'Testimonials by company retrieved successfully');
  });

  getUniqueCompanies = catchAsync(async (req: Request, res: ExpressResponse) => {
    const result = await TestimonialService.getUniqueCompanies();
    return Response.success(res, result, 'Unique companies retrieved successfully');
  });

  getTestimonialCountBySolutionId = catchAsync(async (req: Request, res: ExpressResponse) => {
    const solutionId = parseInt(req.params.solutionId);
    const result = await TestimonialService.getTestimonialCountBySolutionId(solutionId);
    return Response.success(res, { count: result }, 'Testimonial count by solution retrieved successfully');
  });
}

export default new TestimonialController();