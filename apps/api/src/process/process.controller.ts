import { Controller, Get, Param } from '@nestjs/common';
import { ProcessService } from './process.service';

@Controller('process')
export class ProcessController {
  constructor(private readonly process: ProcessService) {}

  @Get('overview')
  overview() {
    return this.process.overview();
  }

  @Get('flow/:type/:id')
  flow(@Param('type') type: string, @Param('id') id: string) {
    return this.process.flow(type, Number(id));
  }
}
