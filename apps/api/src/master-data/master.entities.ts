import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @OneToMany(() => Plant, (p) => p.company)
  plants: Plant[];
}

@Entity('plants')
export class Plant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => Company, (c) => c.plants, { eager: true, onDelete: 'CASCADE' })
  company: Company;

  @OneToMany(() => StorageLocation, (s) => s.plant)
  storageLocations: StorageLocation[];
}

@Entity('storage_locations')
export class StorageLocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => Plant, (p) => p.storageLocations, {
    eager: true,
    onDelete: 'CASCADE',
  })
  plant: Plant;
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: 'EA' })
  unit: string;

  @Column('real', { default: 0 })
  standardPrice: number;

  @Column({ default: '成品' })
  category: string;
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: '' })
  city: string;
}

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ default: '' })
  city: string;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @CreateDateColumn()
  createdAt: Date;
}
