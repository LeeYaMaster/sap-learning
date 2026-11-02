import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiModule } from '../fi/fi.module';
import { InventoryModule } from '../inventory/inventory.module';
import { MasterDataModule } from '../master-data/master-data.module';
import {
  CustomerBilling,
  CustomerBillingItem,
  Delivery,
  DeliveryItem,
  SalesOrder,
  SalesOrderItem,
} from './sd.entities';
import { SdController } from './sd.controller';
import { SdService } from './sd.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderItem,
      Delivery,
      DeliveryItem,
      CustomerBilling,
      CustomerBillingItem,
    ]),
    MasterDataModule,
    InventoryModule,
    FiModule,
  ],
  controllers: [SdController],
  providers: [SdService],
  exports: [SdService, TypeOrmModule],
})
export class SdModule {}
