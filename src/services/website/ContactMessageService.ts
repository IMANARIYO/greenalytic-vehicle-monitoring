import { 
  CreateContactMessageDTO, 
  UpdateContactMessageDTO, 
  ContactMessageQueryDTO,
  ContactMessageResponseDTO,
  ContactMessageListResponseDTO,
  CreateContactMessageResponseDTO
} from '../../types/webiste/dtos/ContactMessageDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import ContactMessageRepository from '../../repositories/website/ContactMessageRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class ContactMessageService {
  
  // Helper function to validate email format
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async createContactMessage(dto: CreateContactMessageDTO): Promise<CreateContactMessageResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'email', 'subject', 'message'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateContactMessageDTO] || 
        dto[field as keyof CreateContactMessageDTO]?.trim().length === 0
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate email format
      if (!this.validateEmail(dto.email.trim())) {
        throw new AppError('Please provide a valid email address', HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.email.trim().length > 255) {
        throw new AppError('Email must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.subject.trim().length > 200) {
        throw new AppError('Subject must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.message.trim().length > 2000) {
        throw new AppError('Message must be 2000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Additional validation for minimum lengths
      if (dto.name.trim().length < 2) {
        throw new AppError('Name must be at least 2 characters long', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.subject.trim().length < 5) {
        throw new AppError('Subject must be at least 5 characters long', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.message.trim().length < 10) {
        throw new AppError('Message must be at least 10 characters long', HttpStatusCode.BAD_REQUEST);
      }

      // Rate limiting check - prevent spam (optional)
      const recentMessages = await ContactMessageRepository.findRecentMessages(1); // Last 1 hour
      const messagesFromThisEmail = recentMessages.filter(msg => 
        msg.email.toLowerCase() === dto.email.trim().toLowerCase()
      );

      if (messagesFromThisEmail.length >= 3) {
        throw new AppError('Too many messages sent recently. Please wait before sending another message.', HttpStatusCode.TOO_MANY_REQUESTS);
      }

      // Create contact message
      const contactMessage = await ContactMessageRepository.create({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject.trim(),
        message: dto.message.trim()
      });

      logger.info('ContactMessageService::createContactMessage success', { 
        contactMessageId: contactMessage.id,
        email: contactMessage.email,
        subject: contactMessage.subject
      });

      return {
        message: 'Thank you for your message! We will get back to you soon.',
        data: contactMessage
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::createContactMessage', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to send contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::createContactMessage', appError);
      throw appError;
    }
  }

  async getAllContactMessages(params: PaginationParams & {
    search?: string;
    email?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ContactMessageListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        email,
        dateFrom,
        dateTo,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = params;

      // Validate pagination parameters
      if (page < 1) {
        throw new AppError('Page number must be greater than 0', HttpStatusCode.BAD_REQUEST);
      }
      
      if (limit < 1 || limit > 100) {
        throw new AppError('Limit must be between 1 and 100', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortOrder
      if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
        throw new AppError('Sort order must be either "asc" or "desc"', HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = ['id', 'name', 'email', 'subject', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate date range
      if (dateFrom && dateTo && dateFrom > dateTo) {
        throw new AppError('Start date must be before end date', HttpStatusCode.BAD_REQUEST);
      }

      // Build where clause for filtering
      const whereClause: any = {};

      // Search filtering
      if (search && search.trim().length > 0) {
        whereClause.OR = [
          {
            name: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            subject: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            message: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Email filtering
      if (email && email.trim().length > 0) {
        whereClause.email = {
          contains: email.trim(),
          mode: 'insensitive'
        };
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const result = await ContactMessageRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('ContactMessageService::getAllContactMessages success', { 
        totalCount: result.totalCount,
        page,
        limit,
        email,
        hasDateFilter: !!(dateFrom || dateTo)
      });

      return {
        data: result.data,
        meta: {
          page,
          limit,
          totalItems: result.totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          nextPage: page < totalPages ? page + 1 : undefined,
          prevPage: page > 1 ? page - 1 : undefined,
          sortBy,
          sortOrder,
          filters: {
            email,
            dateFrom,
            dateTo
          }
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getAllContactMessages', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getAllContactMessages', appError);
      throw appError;
    }
  }

  async getContactMessageById(id: number): Promise<ContactMessageResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid contact message ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const contactMessage = await ContactMessageRepository.findById(id);

      if (!contactMessage) {
        throw new AppError('Contact message not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('ContactMessageService::getContactMessageById success', { id });
      return contactMessage;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessageById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getContactMessageById', appError);
      throw appError;
    }
  }

  async updateContactMessage(id: number, dto: UpdateContactMessageDTO): Promise<ContactMessageResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid contact message ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if contact message exists
      const existingContactMessage = await ContactMessageRepository.findById(id);
      if (!existingContactMessage) {
        throw new AppError('Contact message not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate field lengths if they are being updated
      if (dto.name !== undefined) {
        if (!dto.name || dto.name.trim().length === 0) {
          throw new AppError('Name cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.name.trim().length > 100) {
          throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.email !== undefined) {
        if (!dto.email || dto.email.trim().length === 0) {
          throw new AppError('Email cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (!this.validateEmail(dto.email.trim())) {
          throw new AppError('Please provide a valid email address', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.email.trim().length > 255) {
          throw new AppError('Email must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.subject !== undefined) {
        if (!dto.subject || dto.subject.trim().length === 0) {
          throw new AppError('Subject cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.subject.trim().length > 200) {
          throw new AppError('Subject must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.message !== undefined) {
        if (!dto.message || dto.message.trim().length === 0) {
          throw new AppError('Message cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.message.trim().length > 2000) {
          throw new AppError('Message must be 2000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateContactMessageDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.email !== undefined) updateData.email = dto.email.trim().toLowerCase();
      if (dto.subject !== undefined) updateData.subject = dto.subject.trim();
      if (dto.message !== undefined) updateData.message = dto.message.trim();

      const updatedContactMessage = await ContactMessageRepository.update(id, updateData);

      logger.info('ContactMessageService::updateContactMessage success', { id });
      return updatedContactMessage;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::updateContactMessage', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::updateContactMessage', appError);
      throw appError;
    }
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid contact message ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingContactMessage = await ContactMessageRepository.findById(id);
      if (!existingContactMessage) {
        throw new AppError('Contact message not found', HttpStatusCode.NOT_FOUND);
      }

      await ContactMessageRepository.delete(id);

      logger.info('ContactMessageService::deleteContactMessage success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::deleteContactMessage', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete contact message',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::deleteContactMessage', appError);
      throw appError;
    }
  }

  async getContactMessagesByEmail(email: string): Promise<ContactMessageResponseDTO[]> {
    try {
      // Validate email parameter
      if (!email || email.trim().length === 0) {
        throw new AppError('Email parameter is required', HttpStatusCode.BAD_REQUEST);
      }

      if (!this.validateEmail(email.trim())) {
        throw new AppError('Please provide a valid email address', HttpStatusCode.BAD_REQUEST);
      }

      const contactMessages = await ContactMessageRepository.findByEmail(email.trim());

      logger.info('ContactMessageService::getContactMessagesByEmail success', { 
        email,
        count: contactMessages.length 
      });

      return contactMessages;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessagesByEmail', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch contact messages by email',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getContactMessagesByEmail', appError);
      throw appError;
    }
  }

  async getRecentContactMessages(hours: number = 24): Promise<ContactMessageResponseDTO[]> {
    try {
      // Validate hours parameter
      if (hours <= 0 || hours > 168) { // Max 7 days
        throw new AppError('Hours must be between 1 and 168 (7 days)', HttpStatusCode.BAD_REQUEST);
      }

      const contactMessages = await ContactMessageRepository.findRecentMessages(hours);

      logger.info('ContactMessageService::getRecentContactMessages success', { 
        hours,
        count: contactMessages.length 
      });

      return contactMessages;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getRecentContactMessages', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch recent contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getRecentContactMessages', appError);
      throw appError;
    }
  }
}

export default new ContactMessageService();