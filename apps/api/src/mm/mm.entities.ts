import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  Material,
  Plant,
  StorageLocation,
  Vendor,
} from '../master-data/master.entities';

export type PrStatus = 'DRAFT' | 'RELEASED' | 'CONVERTED';
export type PoStatus = 'OPEN' | 'PARTIAL' | 'RECEIVED' | 'CLOSED';

@Entity('purchase_requisitions')
export class PurchaseRequisition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'DRAFT' })
  status: PrStatus;

  @Column({ default: '采购员' })
  requester: string;

  @Column({ default: '' })
  remark: string;

  @OneToMany(() => PurchaseRequisitionItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: PurchaseRequisitionItem[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('purchase_requisition_items')
export class PurchaseRequisitionItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseRequisition, (h) => h.items, { onDelete: 'CASCADE' })
  header: PurchaseRequisition;

  @Column({ type: 'int' })
  lineNumber: number;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @ManyToOne(() => Plant, { eager: true })
  plant: Plant;

  @Column('real')
  qty: number;
}

@Entity('purchase_orders')
export class PurchaseOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'OPEN' })
  status: PoStatus;

  @ManyToOne(() => Vendor, { eager: true })
  vendor: Vendor;

  @ManyToOne(() => PurchaseRequisition, { nullable: true, eager: true })
  pr: PurchaseRequisition | null;

  @Column({ default: '' })
  remark: string;

  @OneToMany(() => PurchaseOrderItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: PurchaseOrderItem[];

  @OneToMany(() => GoodsReceipt, (g) => g.po)
  goodsReceipts: GoodsReceipt[];

  @OneToMany(() => VendorInvoice, (v) => v.po)
  invoices: VendorInvoice[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('purchase_order_items')
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PurchaseOrder, (h) => h.items, { onDelete: 'CASCADE' })
  header: PurchaseOrder;

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
  receivedQty: number;

  @Column('real', { default: 0 })
  invoicedQty: number;
}

@Entity('goods_receipts')
export class GoodsReceipt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'POSTED' })
  status: string;

  @ManyToOne(() => PurchaseOrder, (p) => p.goodsReceipts, { eager: true })
  po: PurchaseOrder;

  @OneToMany(() => GoodsReceiptItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: GoodsReceiptItem[];

  @CreateDateColumn()
  postingDate: Date;
}

@Entity('goods_receipt_items')
export class GoodsReceiptItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => GoodsReceipt, (h) => h.items, { onDelete: 'CASCADE' })
  header: GoodsReceipt;

  @ManyToOne(() => PurchaseOrderItem, { eager: true })
  poItem: PurchaseOrderItem;

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
}

@Entity('vendor_invoices')
export class VendorInvoice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  docNumber: string;

  @Column({ default: 'POSTED' })
  status: string;

  @ManyToOne(() => PurchaseOrder, (p) => p.invoices, { eager: true })
  po: PurchaseOrder;

  @ManyToOne(() => Vendor, { eager: true })
  vendor: Vendor;

  @Column('real', { default: 0 })
  amount: number;

  @OneToMany(() => VendorInvoiceItem, (i) => i.header, {
    cascade: true,
    eager: true,
  })
  items: VendorInvoiceItem[];

  @CreateDateColumn()
  postingDate: Date;
}

@Entity('vendor_invoice_items')
export class VendorInvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VendorInvoice, (h) => h.items, { onDelete: 'CASCADE' })
  header: VendorInvoice;

  @ManyToOne(() => PurchaseOrderItem, { eager: true })
  poItem: PurchaseOrderItem;

  @ManyToOne(() => Material, { eager: true })
  material: Material;

  @Column('real')
  qty: number;

  @Column('real')
  unitPrice: number;
}
