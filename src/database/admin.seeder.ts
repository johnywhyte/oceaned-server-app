import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

/**
 * Seeds a default SUPER_ADMIN account so every environment is usable out of
 * the box. Runs on application bootstrap (i.e. every server start / deploy),
 * after RoleSeeder has ensured the roles exist.
 *
 * Behaviour:
 * - If the admin does not exist, it is created.
 * - If it already exists, it is left untouched so a password changed via the
 *   UI is never clobbered on the next deploy.
 * - Set ADMIN_FORCE_RESET=true to also reset an existing admin's password,
 *   role and active flag to the seed values (one-time recovery). Unset it
 *   again after the deploy so later logins aren't reset on every restart.
 *
 * Overridable via env: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FORCE_RESET.
 */
@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  private readonly adminEmail = process.env.ADMIN_EMAIL ?? 'admin@oceaned.com';
  private readonly adminPassword =
    process.env.ADMIN_PASSWORD ?? 'Password123!';
  private readonly forceReset = process.env.ADMIN_FORCE_RESET === 'true';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    const existing = await this.userRepository.findOne({
      where: { email: this.adminEmail },
    });

    if (existing) {
      if (!this.forceReset) return;

      // Assigning a plain value re-triggers the @BeforeUpdate hash hook.
      existing.password = this.adminPassword;
      existing.roleId = 3; // SUPER_ADMIN
      existing.isActive = true;
      await this.userRepository.save(existing);
      this.logger.warn(
        `Reset SUPER_ADMIN password for ${this.adminEmail} (ADMIN_FORCE_RESET=true)`,
      );
      return;
    }

    // Password is hashed automatically by User's @BeforeInsert hook.
    const admin = this.userRepository.create({
      email: this.adminEmail,
      password: this.adminPassword,
      firstName: 'Site',
      lastName: 'Admin',
      roleId: 3, // SUPER_ADMIN
      isActive: true,
    });

    await this.userRepository.save(admin);
    this.logger.log(`Seeded SUPER_ADMIN: ${this.adminEmail}`);
  }
}
