import { Controller, Get, Post } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller()
export class SeedController {
  constructor(private readonly seed: SeedService) {}

  @Get('health')
  health() {
    return { ok: true, name: 'sap-mini-erp' };
  }

  @Post('seed')
  async seedDemo() {
    await this.seed.resetAndSeed();
    return { ok: true, message: '已重置并写入演示数据' };
  }
}
