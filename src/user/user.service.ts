import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) throw new ConflictException('Email already exists');

    const role = await this.roleRepository.findOne({
      where: { id: createUserDto.roleId },
    });
    if (!role) throw new NotFoundException('Role not found');

    // ❌ REMOVED: Don't store password in variable for email
    // const temporaryPassword = createUserDto.password;

    const user = this.userRepository.create({
      ...createUserDto,
      role: role, 
    });
    
    const savedUser = await this.userRepository.save(user);

    try {
      // ✅ FIXED: Send welcome email WITHOUT password
      await this.emailService.sendWelcomeEmail(
        savedUser.email,
        savedUser.firstName,
        // Password parameter removed
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return savedUser;
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUserId: number, userRole: string) {
    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['role'] 
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwner = Number(currentUserId) === Number(id);
    const isAdmin = userRole === 'SUPER_ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (!isAdmin && updateUserDto.roleId) {
      delete updateUserDto.roleId;
    }

    if (updateUserDto.roleId) {
      const newRole = await this.roleRepository.findOne({ where: { id: updateUserDto.roleId } });
      if (newRole) user.role = newRole;
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
    await this.userRepository.softDelete(id);
    return { message: `User with ID ${id} has been deactivated successfully` };
  }

  async hardDelete(id: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    await this.userRepository.remove(user);
    return { message: `User with ID ${id} has been permanently deleted` };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ 
        where: { email },
        relations: ['role'] 
    });
  }

  async getCurrentProfile(id: number): Promise<User> {
    return this.findOne(id);
  }

  async getStatistics() {
    const [total, active] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);
    return { total, active };
  }

  async findAll(filters?: any) {
    const page = Number(filters?.page) || 1;
    const limit = Number(filters?.limit) || 10;
    const skip = (page - 1) * limit;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.deletedAt IS NULL');

    if (filters?.search) {
      query.andWhere(
        '(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);
    const [users, total] = await query.getManyAndCount();

    return {
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}