import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationsService) {}

 

  @Post()
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new application',
    description:
      'Creates a DRAFT application for the authenticated student. A pivot record is also created in user_applications.',
  })
  @ApiResponse({ status: 201, description: 'Application created successfully.' })
  @ApiResponse({ status: 409, description: 'Duplicate application for same scholarship + program.' })
  create(@Request() req, @Body() dto: CreateApplicationDto) {
    return this.applicationService.create(req.user.id, dto);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Get my applications',
    description: 'Returns all applications belonging to the authenticated student with pagination.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of student applications.' })
  getMyApplications(@Request() req, @Query() query: QueryApplicationDto) {
    return this.applicationService.findMyApplications(req.user.id, query);
  }

  @Get('my/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Get a single application (student)',
    description: 'Fetches one application. Returns 403 if the application does not belong to the student.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application details.' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your application.' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  getMyApplication(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.applicationService.findOne(id, req.user.id);
  }

  @Patch('my/:id')
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Update a DRAFT application',
    description: 'Only DRAFT applications can be edited. Completion percentage is recalculated on every update.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application updated.' })
  @ApiResponse({ status: 403, description: 'Application is not in DRAFT status.' })
  updateMyApplication(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationService.update(id, req.user.id, dto);
  }

  @Post('my/:id/submit')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a DRAFT application',
    description:
      'Transitions the application from DRAFT → SUBMITTED. Application must be 100% complete.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application submitted.' })
  @ApiResponse({ status: 400, description: 'Application is incomplete.' })
  @ApiResponse({ status: 409, description: 'Application is not in DRAFT status.' })
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() dto: SubmitApplicationDto,
  ) {
    return this.applicationService.submit(id, req.user.id, dto);
  }

  @Post('my/:id/withdraw')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw an application',
    description: 'Student can withdraw if status is DRAFT, SUBMITTED, or UNDER_REVIEW.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application withdrawn.' })
  @ApiResponse({ status: 409, description: 'Cannot withdraw at current status.' })
  withdraw(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.applicationService.withdraw(id, req.user.id);
  }


  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({
    summary: '[Admin] Get all applications',
    description: 'Returns paginated list of all applications. Supports filtering by status, scholarshipId, programId, userId.',
  })
  @ApiResponse({ status: 200, description: 'Paginated applications list.' })
  findAll(@Query() query: QueryApplicationDto) {
    return this.applicationService.findAll(query);
  }

  @Get('admin/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({ summary: '[Admin] Get a single application with full relations' })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Full application details.' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.findOneAdmin(id);
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({
    summary: '[Admin] Update application status',
    description:
      'Moves the application through the review lifecycle. Rejection requires a rejectionReason.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Status updated.' })
  @ApiResponse({ status: 400, description: 'Missing rejectionReason on REJECTED status.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    return this.applicationService.updateStatus(id, dto, req.user.id);
  }

  @Delete('admin/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[Admin] Soft-delete an application',
    description: 'Sets deleted_at timestamp. Application is not permanently removed.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'Application deleted.' })
  @ApiResponse({ status: 404, description: 'Application not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.remove(id);
  }


  @Get('admin/:id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.APPLICATION_MANAGER)
  @ApiOperation({
    summary: '[Admin] Get user_applications pivot records',
    description: 'Returns all users linked to this application via the user_applications pivot table.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Application ID' })
  @ApiResponse({ status: 200, description: 'List of user-application pivot records.' })
  getUserApplicationPivots(@Param('id', ParseIntPipe) id: number) {
    return this.applicationService.getUserApplicationPivots(id);
  }
}