import { 
  Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, 
  JoinColumn, Index, CreateDateColumn, UpdateDateColumn, 
  DeleteDateColumn, BeforeInsert, BeforeUpdate, 
  OneToOne
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Role } from './role.entity';
import { ScholarshipApplication } from "../../scholarship/entities/schol-application.entity";
import { SavedScholarship } from "../../scholarship/entities";
import { UserProfile } from '../../profiles/entities/user-profile.entity';
import { UserApplication } from '../../applications/entities/user-application.entity';
import { UserDocument } from '../../documents/entities/user-document.entity';
import { Document } from '../../documents/entities/document.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'role_id', type: 'bigint' })
  @Index('idx_users_role_id')
  roleId: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'google_id', type: 'varchar', length: 255, nullable: true })
  @Index('idx_users_google_id')
  googleId: string | null;

  @Column({ name: 'preferred_country', type: 'varchar', length: 100, nullable: true })
  preferredCountry: string | null;

  @Column({ name: 'preferred_course', type: 'varchar', length: 200, nullable: true })
  preferredCourse: string | null;

  @Column({ name: 'preferred_degree_type', type: 'varchar', length: 100, nullable: true })
  preferredDegreeType: string | null;

  @Column({ name: 'budget_range', type: 'varchar', length: 50, nullable: true })
  budgetRange: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: true })
  isActive: boolean;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ name: 'reset_password_token', type: 'varchar', length: 500, nullable: true })
  @Exclude()
  resetPasswordToken: string | null;

  @Column({ name: 'reset_password_expires_at', type: 'datetime', nullable: true })
  @Exclude()
  resetPasswordExpiresAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => SavedScholarship, (saved) => saved.user)
  savedScholarships: SavedScholarship[];

  @OneToMany(() => ScholarshipApplication, (application) => application.user)
  applications: ScholarshipApplication[];

  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
   profile: UserProfile;

   @OneToMany(() => UserApplication, (ua) => ua.user)
   userApplications: UserApplication[];

   @OneToMany(() => Document, (doc) => doc.user)
 documents: Document[];

@OneToMany(() => UserDocument, (ud) => ud.user)
userDocuments: UserDocument[];


  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }
}