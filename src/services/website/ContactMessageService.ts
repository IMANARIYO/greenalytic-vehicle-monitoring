import { 
  CreateContactMessageDTO, 
  UpdateContactMessageDTO, 
  ContactMessageQueryDTO,
  ContactMessageResponseDTO,
  ContactMessageListResponseDTO,
  CreateContactMessageResponseDTO,
  EmailStatusDTO
} from '../../types/webiste/dtos/ContactMessageDto.js';
import { PaginationParams } from '../../types/GlobalTypes.js';
import ContactMessageRepository from '../../repositories/website/ContactMessageRepository.js';
import EmailService from '../../services/website/EmailService.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export class ContactMessageService {
  
  async createContactMessage(dto: CreateContactMessageDTO): Promise<CreateContactMessageResponseDTO & { emailStatus: EmailStatusDTO }> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'email', 'subject', 'message'];
      const missingFields = requiredFields.filter(field => {
        const value = dto[field as keyof CreateContactMessageDTO];
        return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
      });
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 255) {
        throw new AppError('Name must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.email.trim().length > 255) {
        throw new AppError('Email must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.subject.trim().length > 500) {
        throw new AppError('Subject must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.message.trim().length > 5000) {
        throw new AppError('Message must be 5000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(dto.email.trim())) {
        throw new AppError('Invalid email format', HttpStatusCode.BAD_REQUEST);
      }

      // Create contact message first (save to DB even if email fails)
      const contactMessage = await ContactMessageRepository.create({
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        subject: dto.subject.trim(),
        message: dto.message.trim()
      });

      logger.info('ContactMessageService::createContactMessage success', { 
        contactMessageId: contactMessage.id,
        name: contactMessage.name,
        email: contactMessage.email
      });

      // Send emails (non-blocking - even if emails fail, contact message is saved)
      const emailData = {
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        message: contactMessage.message,
        submittedAt: contactMessage.createdAt
      };

      const emailStatus = await EmailService.sendContactEmails(emailData);

      // Log email status
      if (!emailStatus.userEmailSent || !emailStatus.adminEmailSent) {
        logger.warn('ContactMessageService::createContactMessage email issues', {
          contactMessageId: contactMessage.id,
          userEmailSent: emailStatus.userEmailSent,
          adminEmailSent: emailStatus.adminEmailSent,
          userEmailError: emailStatus.userEmailError,
          adminEmailError: emailStatus.adminEmailError
        });
      }

      return {
        message: 'Contact message submitted successfully',
        data: contactMessage,
        emailStatus
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::createContactMessage', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to create contact message',
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
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ContactMessageListResponseDTO> {
    try {
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

      // Build where clause for filtering
      const whereClause: any = {};
      const andConditions: any[] = [];

      // Search filtering
      if (search && search.trim().length > 0) {
        andConditions.push({
          OR: [
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
          ]
        });
      }

      // Email filtering
      if (email && email.trim().length > 0) {
        andConditions.push({
          email: {
            equals: email.trim(),
            mode: 'insensitive'
          }
        });
      }

      // Date range filtering
      if (dateFrom || dateTo) {
        const dateFilter: any = {};
        if (dateFrom) {
          dateFilter.gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999); // Include entire day
          dateFilter.lte = endDate;
        }
        andConditions.push({
          createdAt: dateFilter
        });
      }

      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      const result = await ContactMessageRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('ContactMessageService::getAllContactMessages success', { 
        totalCount: result.totalCount,
        page,
        limit
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
          sortOrder
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getAllContactMessages', error);
        throw error;
      }

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
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessageById', error);
        throw error;
      }

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
        if (dto.name.trim().length > 255) {
          throw new AppError('Name must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.email !== undefined) {
        if (!dto.email || dto.email.trim().length === 0) {
          throw new AppError('Email cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.email.trim().length > 255) {
          throw new AppError('Email must be 255 characters or less', HttpStatusCode.BAD_REQUEST);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dto.email.trim())) {
          throw new AppError('Invalid email format', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.subject !== undefined) {
        if (!dto.subject || dto.subject.trim().length === 0) {
          throw new AppError('Subject cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.subject.trim().length > 500) {
          throw new AppError('Subject must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.message !== undefined) {
        if (!dto.message || dto.message.trim().length === 0) {
          throw new AppError('Message cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.message.trim().length > 5000) {
          throw new AppError('Message must be 5000 characters or less', HttpStatusCode.BAD_REQUEST);
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
      if (error instanceof AppError) {
        logger.error('ContactMessageService::updateContactMessage', error);
        throw error;
      }

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
      if (error instanceof AppError) {
        logger.error('ContactMessageService::deleteContactMessage', error);
        throw error;
      }

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
      if (!email || email.trim().length === 0) {
        throw new AppError('Email cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const contactMessages = await ContactMessageRepository.findByEmail(email.trim());

      logger.info('ContactMessageService::getContactMessagesByEmail success', { 
        email,
        count: contactMessages.length
      });

      return contactMessages;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessagesByEmail', error);
        throw error;
      }

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

  async getRecentContactMessages(days: number = 7): Promise<ContactMessageResponseDTO[]> {
    try {
      if (isNaN(days) || days <= 0) {
        throw new AppError('Days must be a positive number', HttpStatusCode.BAD_REQUEST);
      }

      const contactMessages = await ContactMessageRepository.findRecentMessages(days);

      logger.info('ContactMessageService::getRecentContactMessages success', { 
        days,
        count: contactMessages.length
      });

      return contactMessages;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getRecentContactMessages', error);
        throw error;
      }

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

  async getContactMessageCount(): Promise<number> {
    try {
      const count = await ContactMessageRepository.count();

      logger.info('ContactMessageService::getContactMessageCount success', { 
        count
      });

      return count;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessageCount', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to count contact messages',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getContactMessageCount', appError);
      throw appError;
    }
  }

  async getContactMessageCountByEmail(email: string): Promise<number> {
    try {
      if (!email || email.trim().length === 0) {
        throw new AppError('Email cannot be empty', HttpStatusCode.BAD_REQUEST);
      }

      const count = await ContactMessageRepository.countByEmail(email.trim());

      logger.info('ContactMessageService::getContactMessageCountByEmail success', { 
        email,
        count
      });

      return count;
    } catch (error: any) {
      if (error instanceof AppError) {
        logger.error('ContactMessageService::getContactMessageCountByEmail', error);
        throw error;
      }

      const appError = new AppError(
        error.message || 'Failed to count contact messages by email',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('ContactMessageService::getContactMessageCountByEmail', appError);
      throw appError;
    }
  }
}

export default new ContactMessageService();