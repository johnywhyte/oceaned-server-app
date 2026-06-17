import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ScholarshipService } from './scholarship.service';
import { CreateScholarshipDto } from './dto/create-scholarship.dto';
import { UpdateScholarshipDto } from './dto/update-scholarship.dto';
import { FilterScholarshipDto } from './dto/filter-scholarship.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Scholarships (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
@ApiBearerAuth('JWT-auth')
@Controller('scholarships/admin')
export class ScholarshipAdminController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Get('all')
  @ApiOperation({
    summary: '[Admin] Get all scholarships including unpublished',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of all scholarships',
  })
  async getAllScholarships(@Query() filters: FilterScholarshipDto) {
    return this.scholarshipService.getAllScholarships(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get a single scholarship by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Scholarship details' })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async getScholarshipById(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipService.getScholarshipById(id);
  }

  @Post()
  @ApiOperation({ summary: '[Admin] Create a new scholarship' })
  @ApiResponse({ status: 201, description: 'Scholarship created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createScholarship(
    @GetUser('id') adminId: number,
    @Body() dto: CreateScholarshipDto,
  ) {
    return this.scholarshipService.createScholarship(dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: '[Admin] Update a scholarship' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Scholarship updated successfully' })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async updateScholarship(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateScholarshipDto,
  ) {
    return this.scholarshipService.updateScholarship(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Soft delete a scholarship' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Scholarship deleted successfully' })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async deleteScholarship(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipService.deleteScholarship(id);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: '[Admin] Publish a scholarship' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Scholarship set to published',
  })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async publish(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipService.setPublishStatus(id, true);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: '[Admin] Unpublish a scholarship' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Scholarship set to unpublished',
  })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.scholarshipService.setPublishStatus(id, false);
  }
}
