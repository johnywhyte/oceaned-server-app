import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ScholarshipService } from './scholarship.service';
import { FilterScholarshipDto } from './dto/filter-scholarship.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Scholarships')
@Public()
@Controller('scholarships')
export class ScholarshipController {
  constructor(private readonly scholarshipService: ScholarshipService) {}

  // Dropdowns (Lookup endpoints)

  @Get('countries')
  @ApiTags('Lookups')
  @ApiOperation({ summary: 'Get all countries for dropdowns' })
  @ApiResponse({ status: 200, description: 'List of all countries' })
  async getCountries() {
    return this.scholarshipService.getCountries();
  }

  @Get('degree-types')
  @ApiTags('Lookups')
  @ApiOperation({ summary: 'Get all degree types for dropdowns' })
  @ApiResponse({ status: 200, description: 'List of all degree types' })
  async getDegreeTypes() {
    return this.scholarshipService.getDegreeTypes();
  }

  @Get('fields-of-study')
  @ApiTags('Lookups')
  @ApiOperation({ summary: 'Get all fields of study for dropdowns' })
  @ApiResponse({ status: 200, description: 'List of all fields of study' })
  async getFieldsOfStudy() {
    return this.scholarshipService.getFieldsOfStudy();
  }

  // Public Endpoints

  @Get()
  @ApiOperation({ summary: 'Get all published scholarships with filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of published scholarships',
  })
  async getPublishedScholarships(@Query() filters: FilterScholarshipDto) {
    return this.scholarshipService.getPublishedScholarships(filters);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single published scholarship by slug' })
  @ApiParam({ name: 'slug', example: 'chevening-scholarship-full-2025' })
  @ApiResponse({ status: 200, description: 'Scholarship details' })
  @ApiResponse({ status: 404, description: 'Scholarship not found' })
  async getPublishedScholarshipBySlug(@Param('slug') slug: string) {
    return this.scholarshipService.getPublishedScholarshipBySlug(slug);
  }
}
