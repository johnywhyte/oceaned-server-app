import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { FilterSchoolDto } from './dto/filter-school.dto';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Schools')
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  // Public Endpoints

  @Get()
  @ApiOperation({ summary: 'Get all active schools (public)' })
  findAll(@Query() query: FilterSchoolDto) {
    return this.schoolsService.findAll(query);
  }

  @Get('meta/states')
  @ApiOperation({ summary: 'Distinct list of school states/regions (public)' })
  getStates(@Query('countryId') countryId?: number) {
    return this.schoolsService.getStates(countryId ? Number(countryId) : undefined);
  }

  @Get('recommendations')
  @ApiOperation({
    summary: 'Consistent, multi-country school recommendations (public)',
  })
  recommend(
    @Query('country') country?: string,
    @Query('course') course?: string,
    @Query('limit') limit?: string,
  ) {
    return this.schoolsService.recommend({
      country: country || undefined,
      course: course || undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a school by ID (public)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.findOne(id);
  }

  @Get(':id/session')
  @ApiOperation({
    summary: 'Get the academic-session status of a school (public)',
  })
  getSession(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.getSession(id);
  }

  @Get(':id/programs')
  @ApiOperation({
    summary: 'Get active programs for a school (dependent dropdown)',
  })
  getPrograms(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.getPrograms(id);
  }

  // Admin Endpoints

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bulk-import universities for a country from the Universities API (admin)',
  })
  importFromApi(@Query('country') country = 'Germany') {
    return this.schoolsService.importFromApi(country);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a school (admin)' })
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a school (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a school (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.remove(id);
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get schools list for dropdown (admin)' })
  findAllForDropdown(@Query('search') search?: string) {
    return this.schoolsService.findAllForDropdown(search);
  }

  @Patch('admin/:id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activate a school (admin)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.setActiveStatus(id, true);
  }

  @Patch('admin/:id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Deactivate a school (admin)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.setActiveStatus(id, false);
  }

  @Post('admin/:id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload a school logo (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @Param('id', ParseIntPipe) id: number,

    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|svg)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.schoolsService.uploadLogo(id, file);
  }

  @Delete('admin/:id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove a school logo (admin)' })
  removeLogo(@Param('id', ParseIntPipe) id: number) {
    return this.schoolsService.removeLogo(id);
  }
}
