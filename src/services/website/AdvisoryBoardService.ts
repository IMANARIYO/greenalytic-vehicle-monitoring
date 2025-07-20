import { 
  CreateAdvisoryBoardDTO, 
  UpdateAdvisoryBoardDTO, 
  AdvisoryBoardQueryDTO,
  AdvisoryBoardResponseDTO,
  AdvisoryBoardListResponseDTO,
  CreateAdvisoryBoardResponseDTO,
  SocialLinks
} from '../../types/webiste/dtos/AdvisoryBoardDto.js';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes.js';
import AdvisoryBoardRepository from '../../repositories/website/AdvisoryBoardRepository.js';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';

export class AdvisoryBoardService {
  
  // Helper function to validate social links
  private validateSocialLinks(socialLinks: SocialLinks): void {
    const urlRegex = /^https?:\/\/.+/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (socialLinks.linkedin && !urlRegex.test(socialLinks.linkedin)) {
      throw new AppError('LinkedIn URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
    }
    
    if (socialLinks.twitter && !urlRegex.test(socialLinks.twitter)) {
      throw new AppError('Twitter URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
    }
    
    if (socialLinks.github && !urlRegex.test(socialLinks.github)) {
      throw new AppError('GitHub URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
    }
    
    if (socialLinks.website && !urlRegex.test(socialLinks.website)) {
      throw new AppError('Website URL must be a valid URL starting with http:// or https://', HttpStatusCode.BAD_REQUEST);
    }
    
    if (socialLinks.email && !emailRegex.test(socialLinks.email)) {
      throw new AppError('Email must be a valid email address', HttpStatusCode.BAD_REQUEST);
    }
  }

  // Helper function to transform Prisma result to DTO
  private transformAdvisoryBoardMember(member: any): AdvisoryBoardResponseDTO {
    return {
      ...member,
      socialLinks: member.socialLinks as SocialLinks | null,
      highlight: member.highlight,
      fullBioLink: member.fullBioLink
    };
  }

  async createAdvisoryBoardMember(dto: CreateAdvisoryBoardDTO): Promise<CreateAdvisoryBoardResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'position', 'company', 'description', 'imageUrl'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateAdvisoryBoardDTO] || 
        (typeof dto[field as keyof CreateAdvisoryBoardDTO] === 'string' && 
         (dto[field as keyof CreateAdvisoryBoardDTO] as string).trim().length === 0)
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.position.trim().length > 100) {
        throw new AppError('Position must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.company.trim().length > 100) {
        throw new AppError('Company must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 1000) {
        throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.imageUrl.trim().length > 500) {
        throw new AppError('Image URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate optional fields
      if (dto.highlight && dto.highlight.trim().length > 200) {
        throw new AppError('Highlight must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.fullBioLink && dto.fullBioLink.trim().length > 500) {
        throw new AppError('Full bio link must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate social links if provided
      if (dto.socialLinks) {
        this.validateSocialLinks(dto.socialLinks);
      }

      // Check for duplicate name and company combination
      const existingAdvisoryBoardMember = await AdvisoryBoardRepository.findByNameAndCompany(dto.name.trim(), dto.company.trim());
      if (existingAdvisoryBoardMember) {
        throw new AppError('An advisory board member with this name and company already exists', HttpStatusCode.CONFLICT);
      }

      // Create advisory board member
      const advisoryBoardMember = await AdvisoryBoardRepository.create({
        name: dto.name.trim(),
        position: dto.position.trim(),
        company: dto.company.trim(),
        highlight: dto.highlight?.trim(),
        description: dto.description.trim(),
        imageUrl: dto.imageUrl.trim(),
        socialLinks: dto.socialLinks,
        fullBioLink: dto.fullBioLink?.trim()
      });

      logger.info('AdvisoryBoardService::createAdvisoryBoardMember success', { 
        advisoryBoardMemberId: advisoryBoardMember.id,
        name: advisoryBoardMember.name,
        company: advisoryBoardMember.company
      });

      return {
        message: 'Advisory board member created successfully',
        data: this.transformAdvisoryBoardMember(advisoryBoardMember)
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::createAdvisoryBoardMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::createAdvisoryBoardMember', appError);
      throw appError;
    }
  }

  async getAllAdvisoryBoardMembers(params: PaginationParams & {
    search?: string;
    company?: string;
  }): Promise<AdvisoryBoardListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        company,
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
      const allowedSortFields = ['id', 'name', 'position', 'company', 'createdAt', 'updatedAt'];
      
      if (sortBy && !allowedSortFields.includes(sortBy)) {
        throw new AppError(`Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
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
            position: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            company: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Company filtering
      if (company && company.trim().length > 0) {
        whereClause.company = {
          contains: company.trim(),
          mode: 'insensitive'
        };
      }

      const result = await AdvisoryBoardRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('AdvisoryBoardService::getAllAdvisoryBoardMembers success', { 
        totalCount: result.totalCount,
        page,
        limit,
        company
      });

      return {
        data: result.data.map(member => this.transformAdvisoryBoardMember(member)),
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
            company
          }
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::getAllAdvisoryBoardMembers', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch advisory board members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::getAllAdvisoryBoardMembers', appError);
      throw appError;
    }
  }

  async getAdvisoryBoardMemberById(id: number): Promise<AdvisoryBoardResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid advisory board member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const advisoryBoardMember = await AdvisoryBoardRepository.findById(id);

      if (!advisoryBoardMember) {
        throw new AppError('Advisory board member not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('AdvisoryBoardService::getAdvisoryBoardMemberById success', { id });
      return this.transformAdvisoryBoardMember(advisoryBoardMember);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::getAdvisoryBoardMemberById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::getAdvisoryBoardMemberById', appError);
      throw appError;
    }
  }

  async updateAdvisoryBoardMember(id: number, dto: UpdateAdvisoryBoardDTO): Promise<AdvisoryBoardResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid advisory board member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if advisory board member exists
      const existingAdvisoryBoardMember = await AdvisoryBoardRepository.findById(id);
      if (!existingAdvisoryBoardMember) {
        throw new AppError('Advisory board member not found', HttpStatusCode.NOT_FOUND);
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

      if (dto.position !== undefined) {
        if (!dto.position || dto.position.trim().length === 0) {
          throw new AppError('Position cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.position.trim().length > 100) {
          throw new AppError('Position must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.company !== undefined) {
        if (!dto.company || dto.company.trim().length === 0) {
          throw new AppError('Company cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.company.trim().length > 100) {
          throw new AppError('Company must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.description !== undefined) {
        if (!dto.description || dto.description.trim().length === 0) {
          throw new AppError('Description cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.description.trim().length > 1000) {
          throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.imageUrl !== undefined) {
        if (!dto.imageUrl || dto.imageUrl.trim().length === 0) {
          throw new AppError('Image URL cannot be empty', HttpStatusCode.BAD_REQUEST);
        }
        if (dto.imageUrl.trim().length > 500) {
          throw new AppError('Image URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
        }
      }

      // Validate optional fields
      if (dto.highlight !== undefined && dto.highlight !== null && dto.highlight.trim().length > 200) {
        throw new AppError('Highlight must be 200 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.fullBioLink !== undefined && dto.fullBioLink !== null && dto.fullBioLink.trim().length > 500) {
        throw new AppError('Full bio link must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate social links if provided
      if (dto.socialLinks) {
        this.validateSocialLinks(dto.socialLinks);
      }

      // Check for duplicate name and company combination (excluding current record)
      if (dto.name !== undefined && dto.company !== undefined) {
        const duplicateAdvisoryBoardMember = await AdvisoryBoardRepository.findByNameAndCompany(dto.name.trim(), dto.company.trim());
        if (duplicateAdvisoryBoardMember && duplicateAdvisoryBoardMember.id !== id) {
          throw new AppError('An advisory board member with this name and company already exists', HttpStatusCode.CONFLICT);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateAdvisoryBoardDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.position !== undefined) updateData.position = dto.position.trim();
      if (dto.company !== undefined) updateData.company = dto.company.trim();
      if (dto.highlight !== undefined) updateData.highlight = dto.highlight?.trim();
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl.trim();
      if (dto.socialLinks !== undefined) updateData.socialLinks = dto.socialLinks;
      if (dto.fullBioLink !== undefined) updateData.fullBioLink = dto.fullBioLink?.trim();

      const updatedAdvisoryBoardMember = await AdvisoryBoardRepository.update(id, updateData);

      logger.info('AdvisoryBoardService::updateAdvisoryBoardMember success', { id });
      return this.transformAdvisoryBoardMember(updatedAdvisoryBoardMember);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::updateAdvisoryBoardMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::updateAdvisoryBoardMember', appError);
      throw appError;
    }
  }

  async deleteAdvisoryBoardMember(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid advisory board member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingAdvisoryBoardMember = await AdvisoryBoardRepository.findById(id);
      if (!existingAdvisoryBoardMember) {
        throw new AppError('Advisory board member not found', HttpStatusCode.NOT_FOUND);
      }

      await AdvisoryBoardRepository.delete(id);

      logger.info('AdvisoryBoardService::deleteAdvisoryBoardMember success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::deleteAdvisoryBoardMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete advisory board member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::deleteAdvisoryBoardMember', appError);
      throw appError;
    }
  }

  async getAdvisoryBoardMembersByCompany(company: string): Promise<AdvisoryBoardResponseDTO[]> {
    try {
      // Validate company parameter
      if (!company || company.trim().length === 0) {
        throw new AppError('Company parameter is required', HttpStatusCode.BAD_REQUEST);
      }

      const advisoryBoardMembers = await AdvisoryBoardRepository.findByCompany(company.trim());

      logger.info('AdvisoryBoardService::getAdvisoryBoardMembersByCompany success', { 
        company,
        count: advisoryBoardMembers.length 
      });

      return advisoryBoardMembers.map(member => this.transformAdvisoryBoardMember(member));
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('AdvisoryBoardService::getAdvisoryBoardMembersByCompany', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch advisory board members by company',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('AdvisoryBoardService::getAdvisoryBoardMembersByCompany', appError);
      throw appError;
    }
  }
}

export default new AdvisoryBoardService();