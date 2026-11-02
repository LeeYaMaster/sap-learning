import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiModule } from '../fi/fi.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MasterDataModule } from '../master-data/master-data.module';
import {
  GoodsReceipt,
  GoodsReceiptItem,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseRequisition,
  PurchaseRequisitionItem,
  VendorInvoice,
  VendorInvoiceItem,
} from './mm.entities';
import { MmController } from './mm.controller';
import { MmService } from './mm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequisition,
      PurchaseRequisitionItem,
      PurchaseOrder,
      PurchaseOrderItem,
      GoodsReceipt,
      GoodsReceiptItem,
      VendorInvoice,
      VendorInvoiceItem,
    ]),
    MasterDataModule,
    InventoryModule,
    FiModule,
  ],
  controllers: [MmController],
  providers: [MmService],
  exports: [MmService, TypeOrmModule],
})
export class MmModule {}
