import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

@ApiTags('Programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...ADMIN_ROLES)
@ApiBearerAuth('JWT-auth')
@Controller('programs/admin')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // Admin Endpoints
  @Post('schools/:schoolId')
  @ApiOperation({ summary: 'Create a program under a school (admin)' })
  create(
    @Param('schoolId', ParseIntPipe) schoolId: number,
    @Body() dto: CreateProgramDto,
  ) {
    return this.programsService.create(schoolId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a program by ID (admin)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a program (admin)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProgramDto) {
    return this.programsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a program (admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.remove(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a program (admin)' })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.setActiveStatus(id, true);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a program (admin)' })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.setActiveStatus(id, false);
  }
}
