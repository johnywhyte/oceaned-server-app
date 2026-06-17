import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { FieldOfStudy } from '../../scholarship/entities/field-of-study.entity';

const fieldsOfStudy = [
  // Sciences
  { name: 'Biology' },
  { name: 'Chemistry' },
  { name: 'Physics' },
  { name: 'Mathematics' },
  { name: 'Statistics' },
  { name: 'Environmental Science' },
  { name: 'Earth Science' },
  { name: 'Astronomy' },

  // Engineering & Technology
  { name: 'Computer Science' },
  { name: 'Software Engineering' },
  { name: 'Electrical Engineering' },
  { name: 'Mechanical Engineering' },
  { name: 'Civil Engineering' },
  { name: 'Chemical Engineering' },
  { name: 'Aerospace Engineering' },
  { name: 'Biomedical Engineering' },
  { name: 'Data Science' },
  { name: 'Artificial Intelligence' },
  { name: 'Cybersecurity' },
  { name: 'Information Technology' },

  // Medicine & Health
  { name: 'Medicine' },
  { name: 'Pharmacy' },
  { name: 'Nursing' },
  { name: 'Public Health' },
  { name: 'Dentistry' },
  { name: 'Veterinary Medicine' },
  { name: 'Nutrition & Dietetics' },
  { name: 'Physiotherapy' },
  { name: 'Psychology' },

  // Business & Economics
  { name: 'Business Administration' },
  { name: 'Economics' },
  { name: 'Finance' },
  { name: 'Accounting' },
  { name: 'Marketing' },
  { name: 'Supply Chain Management' },
  { name: 'Entrepreneurship' },
  { name: 'Human Resource Management' },

  // Social Sciences & Humanities
  { name: 'Law' },
  { name: 'Political Science' },
  { name: 'International Relations' },
  { name: 'Sociology' },
  { name: 'Anthropology' },
  { name: 'History' },
  { name: 'Philosophy' },
  { name: 'Linguistics' },
  { name: 'Geography' },
  { name: 'Gender Studies' },

  // Arts & Design
  { name: 'Architecture' },
  { name: 'Fine Arts' },
  { name: 'Graphic Design' },
  { name: 'Film & Media Studies' },
  { name: 'Music' },
  { name: 'Performing Arts' },
  { name: 'Fashion Design' },

  // Education
  { name: 'Education' },
  { name: 'Early Childhood Education' },
  { name: 'Special Education' },

  // Agriculture & Environment
  { name: 'Agriculture' },
  { name: 'Forestry' },
  { name: 'Marine Science' },
  { name: 'Climate Science' },

  // Communication & Media
  { name: 'Journalism' },
  { name: 'Mass Communication' },
  { name: 'Public Relations' },
];

export class FieldOfStudySeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(FieldOfStudy);

    for (const field of fieldsOfStudy) {
      const exists = await repository.findOneBy({ name: field.name });
      if (!exists) {
        await repository.save(repository.create(field));
      }
    }

    console.log(`✅ Fields of study seeded (${fieldsOfStudy.length} records)`);
  }
}
