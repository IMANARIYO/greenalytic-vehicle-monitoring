import { Request, Response as ExpressResponse } from 'express';
import { AuthenticatedRequest } from '../../utils/jwtFunctions.js';
import { catchAsync } from '../../middlewares/errorHandler.js';
import Response from '../../utils/response.js';
import ContactMessageService from '../../services/website/ContactMessageService.js';
import { CreateContactMessageDTO, UpdateContactMessageDTO, ContactMessageQueryDTO } from '../../types/webiste/dtos/ContactMessageDto.js';

class ContactMessageController {

  constructor() {
  }

  createContactMessage = catchAsync(async (req: Request, res: ExpressResponse) => {
    const dto: CreateContactMessageDTO = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message
    };

    const result = await ContactMessageService.createContactMessage(dto);
    return Response.created(res, result, 'Contact message submitted successfully');
  });

  getAllContactMessages = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const query: ContactMessageQueryDTO = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      email: req.query.email as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const result = await ContactMessageService.getAllContactMessages(query);
    return Response.success(res, result, 'Contact messages retrieved successfully');
  });

  getContactMessageById = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const result = await ContactMessageService.getContactMessageById(id);
    return Response.success(res, result, 'Contact message retrieved successfully');
  });

  updateContactMessage = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    const dto: UpdateContactMessageDTO = {
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message
    };

    const result = await ContactMessageService.updateContactMessage(id, dto);
    return Response.success(res, result, 'Contact message updated successfully');
  });

  deleteContactMessage = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const id = parseInt(req.params.id);
    await ContactMessageService.deleteContactMessage(id);
    return Response.success(res, null, 'Contact message deleted successfully');
  });

  getContactMessagesByEmail = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const email = req.params.email;
    const result = await ContactMessageService.getContactMessagesByEmail(email);
    return Response.success(res, result, 'Contact messages by email retrieved successfully');
  });

  getRecentContactMessages = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const result = await ContactMessageService.getRecentContactMessages(days);
    return Response.success(res, result, 'Recent contact messages retrieved successfully');
  });

  getContactMessageCount = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const result = await ContactMessageService.getContactMessageCount();
    return Response.success(res, { count: result }, 'Contact message count retrieved successfully');
  });

  getContactMessageCountByEmail = catchAsync(async (req: AuthenticatedRequest, res: ExpressResponse) => {
    const email = req.params.email;
    const result = await ContactMessageService.getContactMessageCountByEmail(email);
    return Response.success(res, { count: result }, 'Contact message count by email retrieved successfully');
  });
}

export default new ContactMessageController();