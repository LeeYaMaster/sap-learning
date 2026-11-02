import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlAccount } from '../fi/fi.entities';
import { Company } from '../master-data/master.entities';
import { MmModule } from '../mm/mm.module';
import { SdModule } from '../sd/sd.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, GlAccount]), MmModule, SdModule],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
