import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { SeedService } from './database/seed.service';
import { DatabaseModule } from './database/database.module';
import { FiModule } from './fi/fi.module';
import { InventoryModule } from './inventory/inventory.module';
import { MasterDataModule } from './master-data/master-data.module';
import { MmModule } from './mm/mm.module';
import { ProcessModule } from './process/process.module';
import { SdModule } from './sd/sd.module';

const dataDir = join(process.cwd(), 'data');
mkdirSync(dataDir, { recursive: true });

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(dataDir, 'mini-erp.sqlite'),
      autoLoadEntities: true,
      synchronize: true,
    }),
    MasterDataModule,
    InventoryModule,
    FiModule,
    MmModule,
    SdModule,
    ProcessModule,
    DatabaseModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seed: SeedService) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_CLI === '1') return;
    await this.seed.ensureSeeded();
  }
}
