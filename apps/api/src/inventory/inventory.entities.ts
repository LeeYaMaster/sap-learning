import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Material, Plant, StorageLocation } from '../master-data/master.entities';

@Entity('stocks')
@Unique(['material', 'plant', 'storageLocation'])
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Material, { eager: true, onDelete: 'CASCADE' })
  material: Material;

  @ManyToOne(() => Plant, { eager: true, onDelete: 'CASCADE' })
  plant: Plant;

  @ManyToOne(() => StorageLocation, { eager: true, onDelete: 'CASCADE' })
  storageLocation: StorageLocation;

  @Column('real', { default: 0 })
  qty: number;

  @Column('real', { default: 0 })
  value: number;
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @ManyToOne(() => Plant, { eager: true })
  plant: Plant;

  @ManyToOne(() => StorageLocation, { eager: true })
  storageLocation: StorageLocation;

  /** 入库为正，出库为负 */
  @Column('real')
  qty: number;

  @Column('real', { default: 0 })
  unitCost: number;

  @Column('real', { default: 0 })
  amount: number;

  /** 101 收货入库 / 601 发货出库 */
  @Column()
  movementType: string;

  @Column()
  movementName: string;

  @Column()
  refType: string;

  @Column()
  refNumber: string;

  @CreateDateColumn()
  createdAt: Date;
}
