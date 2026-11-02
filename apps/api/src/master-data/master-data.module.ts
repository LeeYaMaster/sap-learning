import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Company,
  Customer,
  Material,
  Plant,
  StorageLocation,
  Vendor,
} from './master.entities';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Plant,
      StorageLocation,
      Material,
      Customer,
      Vendor,
    ]),
  ],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService, TypeOrmModule],
})
export class MasterDataModule {}
