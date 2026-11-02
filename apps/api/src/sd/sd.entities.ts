import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  Customer,
  Material,
  Plant,
  StorageLocation,
} from '../master-data/master.entities';

export type SoStatus = 'OPEN' | 'PARTIAL' | 'DELIVERED' | 'CLOSED';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'OPEN' })
  status: SoStatus;

  @ManyToOne(() => Customer, { eager: true })
  customer: Customer;

  @Column({ default: '' })
  remark: string;

  @OneToMany(() => SalesOrderItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: SalesOrderItem[];

  @OneToMany(() => Delivery, (d) => d.so)
  deliveries: Delivery[];

  @OneToMany(() => CustomerBilling, (b) => b.so)
  billings: CustomerBilling[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('sales_order_items')
export class SalesOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SalesOrder, (h) => h.items, { onDelete: 'CASCADE' })
  header: SalesOrder;

  @Column({ type: 'int' })
  lineNumber: number;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @ManyToOne(() => Plant, { eager: true })
  plant: Plant;

  @ManyToOne(() => StorageLocation, { eager: true })
  storageLocation: StorageLocation;

  @Column('real')
  qty: number;

  @Column('real')
  unitPrice: number;

  @Column('real', { default: 0 })
  deliveredQty: number;

  @Column('real', { default: 0 })
  billedQty: number;
}

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'POSTED' })
  status: string;

  @ManyToOne(() => SalesOrder, (s) => s.deliveries, { eager: true })
  so: SalesOrder;

  @OneToMany(() => DeliveryItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: DeliveryItem[];

  @Column('real', { default: 0 })
  cogsAmount: number;

  @CreateDateColumn()
  postingDate: Date;
}

@Entity('delivery_items')
export class DeliveryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Delivery, (h) => h.items, { onDelete: 'CASCADE' })
  header: Delivery;

  @ManyToOne(() => SalesOrderItem, { eager: true })
  soItem: SalesOrderItem;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @ManyToOne(() => Plant, { eager: true })
  plant: Plant;

  @ManyToOne(() => StorageLocation, { eager: true })
  storageLocation: StorageLocation;

  @Column('real')
  qty: number;

  @Column('real', { default: 0 })
  unitCost: number;
}

@Entity('customer_billings')
export class CustomerBilling {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'POSTED' })
  status: string;

  @ManyToOne(() => SalesOrder, (s) => s.billings, { eager: true })
  so: SalesOrder;

  @ManyToOne(() => Customer, { eager: true })
  customer: Customer;

  @Column('real', { default: 0 })
  amount: number;

  @OneToMany(() => CustomerBillingItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: CustomerBillingItem[];

  @CreateDateColumn()
  postingDate: Date;
}

@Entity('customer_billing_items')
export class CustomerBillingItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CustomerBilling, (h) => h.items, { onDelete: 'CASCADE' })
  header: CustomerBilling;

  @ManyToOne(() => SalesOrderItem, { eager: true })
  soItem: SalesOrderItem;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @Column('real')
  qty: number;

  @Column('real')
  unitPrice: number;
}
