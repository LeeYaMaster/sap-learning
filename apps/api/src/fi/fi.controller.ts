import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FiService } from './fi.service';

@Controller()
export class FiController {
  constructor(private readonly fi: FiService) {}

  @Get('gl-accounts')
  accounts() {
    return this.fi.listAccounts();
  }

  @Get('journal-entries')
  journals() {
    return this.fi.listJournals();
  }

  @Get('journal-entries/:id')
  journal(@Param('id', ParseIntPipe) id: number) {
    return this.fi.getJournal(id);
  }

  @Get('trial-balance')
  trial() {
    return this.fi.trialBalance();
  }
}
