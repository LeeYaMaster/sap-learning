import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalEntry } from '../fi/fi.entities';
import { Stock } from '../inventory/inventory.entities';
import {
  GoodsReceipt,
  PurchaseOrder,
  PurchaseRequisition,
  VendorInvoice,
} from '../mm/mm.entities';
import { CustomerBilling, Delivery, SalesOrder } from '../sd/sd.entities';
import { ProcessController } from './process.controller';
import { ProcessService } from './process.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseRequisition,
      PurchaseOrder,
      GoodsReceipt,
      VendorInvoice,
      SalesOrder,
      Delivery,
      CustomerBilling,
      JournalEntry,
      Stock,
    ]),
  ],
  controllers: [ProcessController],
  providers: [ProcessService],
})
export class ProcessModule {}
