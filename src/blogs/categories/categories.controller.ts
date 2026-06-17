import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/enums';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Only accessible by admin and super admin users',
  })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role.',
  })
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @ApiOperation({
    summary: 'Retrieve all categories',
    description: 'Fetch a list of all available categories',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all categories',
    type: [CreateCategoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role.',
  })
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({
    summary: 'Retrieve a category by ID or slug',
    description:
      'Fetch a single category using either its UUID or slug. The endpoint will automatically determine the type of identifier provided.',
  })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully retrieved.',
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found with the given ID or slug.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role.',
  })
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.categoriesService.findOne(idOrSlug);
  }

  @ApiOperation({
    summary: 'Update a category',
    description: 'Update the details of an existing category by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
    type: CreateCategoryDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found with the given ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role.',
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @ApiOperation({
    summary: 'Delete a category',
    description: 'Remove an existing category by its ID',
  })
  @ApiResponse({
    status: 204,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found with the given ID.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. Missing or invalid JWT token.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. User does not have the required role.',
  })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
