import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/user/entities/role.entity';

@Injectable()
export class RoleSeeder implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const roles = [
      { id: 1, name: 'STUDENT', description: 'Standard student/user' },
      { id: 2, name: 'ADMIN', description: 'School administrator' },
      { id: 3, name: 'SUPER_ADMIN', description: 'System owner' },
    ];

    for (const roleData of roles) {
      const exists = await this.roleRepository.findOne({ 
        where: { id: roleData.id } 
      });

      if (!exists) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
        console.log(`✅ Seeded Role: ${roleData.name} (ID: ${roleData.id})`);
      }
    }
  }
}