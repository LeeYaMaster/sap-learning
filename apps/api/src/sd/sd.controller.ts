import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateSoDto, PostBillingDto, PostDeliveryDto } from './sd.dto';
import { SdService } from './sd.service';

@Controller()
export class SdController {
  constructor(private readonly sd: SdService) {}

  @Get('sales-orders')
  listSo() {
    return this.sd.listSo();
  }

  @Post('sales-orders')
  createSo(@Body() dto: CreateSoDto) {
    return this.sd.createSo(dto);
  }

  @Get('sales-orders/:id')
  getSo(@Param('id', ParseIntPipe) id: number) {
    return this.sd.getSo(id);
  }

  @Get('deliveries')
  listDeliveries() {
    return this.sd.listDeliveries();
  }

  @Get('deliveries/:id')
  getDelivery(@Param('id', ParseIntPipe) id: number) {
    return this.sd.getDelivery(id);
  }

  @Post('deliveries')
  postDelivery(@Body() dto: PostDeliveryDto) {
    return this.sd.postDelivery(dto);
  }

  @Get('customer-billings')
  listBillings() {
    return this.sd.listBillings();
  }

  @Get('customer-billings/:id')
  getBilling(@Param('id', ParseIntPipe) id: number) {
    return this.sd.getBilling(id);
  }

  @Post('customer-billings')
  postBilling(@Body() dto: PostBillingDto) {
    return this.sd.postBilling(dto);
  }
}
