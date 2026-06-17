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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // POST /tags
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new tag',
    description: 'Create a new tag with a unique name and slug.',
  })
  @ApiResponse({
    status: 201,
    description: 'The tag has been successfully created.',
    type: CreateTagDto,
  })
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({
    status: 409,
    description: 'Tag with the same name or slug already exists.',
  })
  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  // GET /tags
  @ApiOperation({
    summary: 'Get all tags',
    description: 'Retrieve a list of all tags.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of tags has been successfully retrieved.',
    type: [CreateTagDto],
  })
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  // GET /tags/:idOrSlug
  @ApiOperation({
    summary: 'Get a tag by ID or slug',
    description: 'Retrieve a tag by its unique ID or slug.',
  })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully retrieved.',
    type: CreateTagDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
  })
  @ApiParam({
    name: 'idOrSlug',
    type: 'string',
    description: 'The unique ID or slug of the tag to retrieve',
  })
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.tagsService.findOne(idOrSlug);
  }

  // PATCH /tags/:id
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update a tag',
    description: 'Update the name or slug of an existing tag.',
  })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully updated.',
    type: CreateTagDto,
  })
  @ApiBody({ type: UpdateTagDto })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The unique ID of the tag to update',
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, updateTagDto);
  }

  // DELETE /tags/:id
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete a tag',
    description: 'Delete an existing tag by its unique ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'The tag has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Tag not found.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The unique ID of the tag to delete',
  })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.remove(id);
  }
}
