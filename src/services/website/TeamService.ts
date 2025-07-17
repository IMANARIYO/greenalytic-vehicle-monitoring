import { 
  CreateTeamDTO, 
  UpdateTeamDTO, 
  TeamQueryDTO,
  TeamResponseDTO,
  TeamListResponseDTO,
  CreateTeamResponseDTO,
  Department,
  SocialLinks
} from '../../types/webiste/dtos/TeamDto';
import { PaginationMeta, PaginationParams } from '../../types/GlobalTypes';
import TeamRepository from '../../repositories/website/TeamRepository';
import { AppError, HttpStatusCode } from '../../middlewares/errorHandler';
import logger from '../../utils/logger';

export class TeamService {
  
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
  private transformTeamMember(member: any): TeamResponseDTO {
    return {
        ...member,
        socialLinks: member.socialLinks as SocialLinks | null,
        experienceYears: member.experienceYears,
        location: member.location, 
        profileUrl: member.profileUrl
    };
    }

  async createTeamMember(dto: CreateTeamDTO): Promise<CreateTeamResponseDTO> {
    try {
      // Validate required fields
      const requiredFields = ['name', 'position', 'department', 'description', 'imageUrl'];
      const missingFields = requiredFields.filter(field => 
        !dto[field as keyof CreateTeamDTO] || 
        (typeof dto[field as keyof CreateTeamDTO] === 'string' && 
         (dto[field as keyof CreateTeamDTO] as string).trim().length === 0)
      );
      
      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate department enum
      if (!Object.values(Department).includes(dto.department)) {
        throw new AppError(`Invalid department. Must be one of: ${Object.values(Department).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate field lengths
      if (dto.name.trim().length > 100) {
        throw new AppError('Name must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.position.trim().length > 100) {
        throw new AppError('Position must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.description.trim().length > 1000) {
        throw new AppError('Description must be 1000 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.imageUrl.trim().length > 500) {
        throw new AppError('Image URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate optional fields
      if (dto.experienceYears !== undefined) {
        if (dto.experienceYears < 0 || dto.experienceYears > 50) {
          throw new AppError('Experience years must be between 0 and 50', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.location && dto.location.trim().length > 100) {
        throw new AppError('Location must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.profileUrl && dto.profileUrl.trim().length > 500) {
        throw new AppError('Profile URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate social links if provided
      if (dto.socialLinks) {
        this.validateSocialLinks(dto.socialLinks);
      }

      // Check for duplicate name and position combination
      const existingTeamMember = await TeamRepository.findByNameAndPosition(dto.name.trim(), dto.position.trim());
      if (existingTeamMember) {
        throw new AppError('A team member with this name and position already exists', HttpStatusCode.CONFLICT);
      }

      // Create team member
      const teamMember = await TeamRepository.create({
        name: dto.name.trim(),
        position: dto.position.trim(),
        department: dto.department,
        description: dto.description.trim(),
        imageUrl: dto.imageUrl.trim(),
        socialLinks: dto.socialLinks,
        experienceYears: dto.experienceYears,
        location: dto.location?.trim(),
        profileUrl: dto.profileUrl?.trim()
      });

      logger.info('TeamService::createTeamMember success', { 
        teamMemberId: teamMember.id,
        name: teamMember.name,
        department: teamMember.department
      });

      return {
        message: 'Team member created successfully',
        data: this.transformTeamMember(teamMember)
        };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::createTeamMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to create team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::createTeamMember', appError);
      throw appError;
    }
  }

  async getAllTeamMembers(params: PaginationParams & {
    search?: string;
    department?: Department;
    location?: string;
  }): Promise<TeamListResponseDTO> {
    try {
      // Business logic validations for pagination parameters
      const {
        page = 1,
        limit = 10,
        search,
        department,
        location,
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

      // Validate department filter
      if (department && !Object.values(Department).includes(department)) {
        throw new AppError(`Invalid department filter. Must be one of: ${Object.values(Department).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      // Validate sortBy field
      const allowedSortFields = ['id', 'name', 'position', 'department', 'experienceYears', 'createdAt', 'updatedAt'];
      
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
            description: {
              contains: search.trim(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Department filtering
      if (department) {
        whereClause.department = department;
      }

      // Location filtering
      if (location && location.trim().length > 0) {
        whereClause.location = {
          contains: location.trim(),
          mode: 'insensitive'
        };
      }

      const result = await TeamRepository.findManyWithFilters(whereClause, page, limit, sortBy, sortOrder);
      const totalPages = Math.ceil(result.totalCount / limit);

      logger.info('TeamService::getAllTeamMembers success', { 
        totalCount: result.totalCount,
        page,
        limit,
        department,
        location
      });

      return {
        data: result.data.map(member => this.transformTeamMember(member)),
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
            department,
            location
          }
        }
      };
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::getAllTeamMembers', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch team members',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::getAllTeamMembers', appError);
      throw appError;
    }
  }

  async getTeamMemberById(id: number): Promise<TeamResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid team member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const teamMember = await TeamRepository.findById(id);

      if (!teamMember) {
        throw new AppError('Team member not found', HttpStatusCode.NOT_FOUND);
      }

      logger.info('TeamService::getTeamMemberById success', { id });
      return this.transformTeamMember(teamMember);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::getTeamMemberById', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::getTeamMemberById', appError);
      throw appError;
    }
  }

  async updateTeamMember(id: number, dto: UpdateTeamDTO): Promise<TeamResponseDTO> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid team member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      // Check if team member exists
      const existingTeamMember = await TeamRepository.findById(id);
      if (!existingTeamMember) {
        throw new AppError('Team member not found', HttpStatusCode.NOT_FOUND);
      }

      // Validate department enum if provided
      if (dto.department !== undefined && !Object.values(Department).includes(dto.department)) {
        throw new AppError(`Invalid department. Must be one of: ${Object.values(Department).join(', ')}`, HttpStatusCode.BAD_REQUEST);
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
      if (dto.experienceYears !== undefined && dto.experienceYears !== null) {
        if (dto.experienceYears < 0 || dto.experienceYears > 50) {
          throw new AppError('Experience years must be between 0 and 50', HttpStatusCode.BAD_REQUEST);
        }
      }

      if (dto.location !== undefined && dto.location !== null && dto.location.trim().length > 100) {
        throw new AppError('Location must be 100 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      if (dto.profileUrl !== undefined && dto.profileUrl !== null && dto.profileUrl.trim().length > 500) {
        throw new AppError('Profile URL must be 500 characters or less', HttpStatusCode.BAD_REQUEST);
      }

      // Validate social links if provided
      if (dto.socialLinks) {
        this.validateSocialLinks(dto.socialLinks);
      }

      // Check for duplicate name and position combination (excluding current record)
      if (dto.name !== undefined && dto.position !== undefined) {
        const duplicateTeamMember = await TeamRepository.findByNameAndPosition(dto.name.trim(), dto.position.trim());
        if (duplicateTeamMember && duplicateTeamMember.id !== id) {
          throw new AppError('A team member with this name and position already exists', HttpStatusCode.CONFLICT);
        }
      }

      // Trim string fields if they exist
      const updateData: UpdateTeamDTO = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.position !== undefined) updateData.position = dto.position.trim();
      if (dto.department !== undefined) updateData.department = dto.department;
      if (dto.description !== undefined) updateData.description = dto.description.trim();
      if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl.trim();
      if (dto.socialLinks !== undefined) updateData.socialLinks = dto.socialLinks;
      if (dto.experienceYears !== undefined) updateData.experienceYears = dto.experienceYears;
      if (dto.location !== undefined) updateData.location = dto.location?.trim();
      if (dto.profileUrl !== undefined) updateData.profileUrl = dto.profileUrl?.trim();

      const updatedTeamMember = await TeamRepository.update(id, updateData);

      logger.info('TeamService::updateTeamMember success', { id });
      return this.transformTeamMember(updatedTeamMember);
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::updateTeamMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to update team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::updateTeamMember', appError);
      throw appError;
    }
  }

  async deleteTeamMember(id: number): Promise<boolean> {
    try {
      // Validate ID
      if (isNaN(id) || id <= 0) {
        throw new AppError('Invalid team member ID. Must be a positive integer.', HttpStatusCode.BAD_REQUEST);
      }

      const existingTeamMember = await TeamRepository.findById(id);
      if (!existingTeamMember) {
        throw new AppError('Team member not found', HttpStatusCode.NOT_FOUND);
      }

      await TeamRepository.delete(id);

      logger.info('TeamService::deleteTeamMember success', { id });
      return true;
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::deleteTeamMember', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to delete team member',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::deleteTeamMember', appError);
      throw appError;
    }
  }

  async getTeamMembersByDepartment(department: Department): Promise<TeamResponseDTO[]> {
    try {
      // Validate department enum
      if (!Object.values(Department).includes(department)) {
        throw new AppError(`Invalid department. Must be one of: ${Object.values(Department).join(', ')}`, HttpStatusCode.BAD_REQUEST);
      }

      const teamMembers = await TeamRepository.findByDepartment(department);

      logger.info('TeamService::getTeamMembersByDepartment success', { 
        department,
        count: teamMembers.length 
      });

      return teamMembers.map(member => this.transformTeamMember(member));
    } catch (error: any) {
      // If it's already an AppError (from repository or business logic), rethrow
      if (error instanceof AppError) {
        logger.error('TeamService::getTeamMembersByDepartment', error);
        throw error;
      }

      // For unexpected errors, wrap as generic AppError
      const appError = new AppError(
        error.message || 'Failed to fetch team members by department',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        undefined,
        false
      );
      logger.error('TeamService::getTeamMembersByDepartment', appError);
      throw appError;
    }
  }
}

export default new TeamService();